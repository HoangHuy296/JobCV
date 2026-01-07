const AIProcess = require('../models/AIProcess');
const AIPrompt = require('../models/AIPrompt');
const APIKey = require('../models/APIKey');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Setting = require('../models/Setting');

/**
 * Service to execute AI processes with their assigned prompts
 * Supports multi-key rotation and load balancing
 */
class AIProcessService {
  constructor() {
    this.model = null;
    this.keyCache = null;
    this.cacheExpiry = null;
  }

  /**
   * Get best available API key with caching
   */
  async getBestAPIKey() {
    try {
      // Check cache (valid for 60 seconds)
      const now = Date.now();
      if (this.keyCache && this.cacheExpiry && now < this.cacheExpiry) {
        return this.keyCache;
      }

      // Get best available key from database
      const apiKey = await APIKey.getBestAvailableKey('gemini');
      
      if (!apiKey) {
        console.warn('No active Gemini API key found in database');
        // Fallback to settings or environment
        const fallbackKey = await Setting.getValue('GEMINI_API_KEY', 'AI', process.env.GEMINI_API_KEY);
        if (fallbackKey) {
          return {
            id: null,
            api_key: fallbackKey,
            provider: 'gemini'
          };
        }
        return null;
      }

      // Cache the key for 60 seconds
      this.keyCache = apiKey;
      this.cacheExpiry = now + 60000;

      return apiKey;
    } catch (error) {
      console.error('Error getting API key:', error);
      // Fallback to environment variable
      const fallbackKey = process.env.GEMINI_API_KEY;
      if (fallbackKey) {
        return {
          id: null,
          api_key: fallbackKey,
          provider: 'gemini'
        };
      }
      return null;
    }
  }

  /**
   * Initialize Gemini AI with best available key
   */
  async initialize() {
    try {
      const apiKeyData = await this.getBestAPIKey();
      
      if (!apiKeyData || !apiKeyData.api_key) {
        console.warn('No Gemini API key available');
        return null;
      }

      this.model = await Setting.getValue('GEMINI_MODEL', 'AI', 'gemini-1.5-flash');
      
      // Increment usage counter if key has ID (from database)
      if (apiKeyData.id) {
        await APIKey.incrementUsage(apiKeyData.id).catch(err => {
          console.error('Error incrementing key usage:', err);
        });
      }

      return new GoogleGenerativeAI(apiKeyData.api_key);
    } catch (error) {
      console.error('Error initializing AIProcessService:', error);
      return null;
    }
  }

  /**
   * Execute an AI process by its code
   * @param {string} processCode - The process code (e.g., 'CV_EXTRACTION')
   * @param {object} variables - Variables to replace in the prompt
   * @param {object} options - Additional options (e.g., file data for vision models)
   * @returns {Promise<object>} - Result with success status and data
   */
  async executeProcess(processCode, variables = {}, options = {}) {
    // Get fresh genAI instance with best available key
    const genAI = await this.initialize();

    if (!genAI) {
      throw new Error('Gemini API key not configured or no keys available');
    }

    try {
      // Get process by code
      const process = await AIProcess.getByCode(processCode);
      
      if (!process) {
        throw new Error(`AI process with code '${processCode}' not found`);
      }

      if (!process.is_active) {
        throw new Error(`AI process '${processCode}' is not active`);
      }

      if (!process.prompt_id) {
        throw new Error(`AI process '${processCode}' has no prompt assigned`);
      }

      // Get prompt content
      const prompt = await AIPrompt.getById(process.prompt_id);
      if (!prompt) {
        throw new Error(`Prompt not found for process '${processCode}'`);
      }

      const promptContent = await AIPrompt.readPromptContent(prompt.filename);
      
      // Replace variables in prompt
      let finalPrompt = promptContent;
      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        finalPrompt = finalPrompt.replace(new RegExp(placeholder, 'g'), variables[key]);
      });

      // Parse process config
      const config = typeof process.config === 'string' 
        ? JSON.parse(process.config) 
        : (process.config || {});

      // Get model from config or use default
      const modelName = config.model || this.model || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });

      // Prepare content for generation
      let content = [finalPrompt];
      
      // Add file data if provided (for vision models)
      if (options.fileData) {
        content.push({
          inlineData: {
            data: options.fileData.base64,
            mimeType: options.fileData.mimeType
          }
        });
      }

      // Generate content
      const result = await model.generateContent(content);
      const response = await result.response;
      const text = response.text();

      // Clean up response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      // Try to parse as JSON if the prompt expects JSON output
      let data;
      try {
        data = JSON.parse(cleanedText);
      } catch (e) {
        // If not JSON, return as text
        data = cleanedText;
      }

      return {
        success: true,
        data: data,
        processCode: processCode,
        processName: process.name
      };
    } catch (error) {
      console.error(`Error executing AI process '${processCode}':`, error);
      return {
        success: false,
        error: error.message,
        data: null,
        processCode: processCode
      };
    }
  }

  /**
   * Get all active processes
   * @returns {Promise<Array>} - List of active processes
   */
  async getActiveProcesses() {
    try {
      const allProcesses = await AIProcess.getAll();
      return allProcesses.filter(p => p.is_active);
    } catch (error) {
      console.error('Error getting active processes:', error);
      return [];
    }
  }

  /**
   * Check if a process is available and active
   * @param {string} processCode - The process code
   * @returns {Promise<boolean>}
   */
  async isProcessAvailable(processCode) {
    try {
      const process = await AIProcess.getByCode(processCode);
      return process && process.is_active && process.prompt_id;
    } catch (error) {
      console.error(`Error checking process availability '${processCode}':`, error);
      return false;
    }
  }
}

module.exports = new AIProcessService();
