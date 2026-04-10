const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const Setting = require('../models/Setting');
const APIKey = require('../models/APIKey');
const aiProcessService = require('./aiProcessService');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.apiKey = null;
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
        this.genAI = null;
        return;
      }

      this.apiKey = apiKeyData.api_key;
      this.model = await Setting.getValue('GEMINI_MODEL', 'AI', 'gemini-1.5-flash');
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      
      // Increment usage counter if key has ID (from database)
      if (apiKeyData.id) {
        await APIKey.incrementUsage(apiKeyData.id).catch(err => {
          console.error('Error incrementing key usage:', err);
        });
      }
    } catch (error) {
      console.error('Error initializing GeminiService:', error);
      this.genAI = null;
    }
  }

  async extractCVInfo(filePath, mimeType) {
    try {
      // Read file as base64
      const fileBuffer = await fs.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');

      // Use AI Process Service to execute CV_EXTRACTION process
      const result = await aiProcessService.executeProcess(
        'CV_EXTRACTION',
        {}, // No text variables needed for this process
        {
          fileData: {
            base64: base64Data,
            mimeType: mimeType
          }
        }
      );

      return result;
    } catch (error) {
      console.error('Error extracting CV info with Gemini:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async extractFromCVSections(sections) {
    // Re-initialize if needed
    if (!this.genAI) {
      await this.initialize();
      if (!this.genAI) {
        throw new Error('Gemini API key not configured');
      }
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Given the following CV sections data, extract and normalize the information into a structured format.
      
CV Sections Data:
${JSON.stringify(sections, null, 2)}

Return ONLY a valid JSON object with this structure:
{
  "name": "Full name extracted from personal info",
  "email": "Email address",
  "phone": "Phone number",
  "address": "Address or location",
  "dateOfBirth": "Date of birth if available",
  "education": [
    {
      "school": "School/University name",
      "degree": "Degree",
      "major": "Major/Field",
      "startDate": "Start date",
      "endDate": "End date",
      "gpa": "GPA if mentioned"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "position": "Position",
      "startDate": "Start date",
      "endDate": "End date",
      "description": "Description"
    }
  ],
  "skills": ["skill1", "skill2"],
  "languages": ["language1", "language2"],
  "certifications": ["cert1", "cert2"],
  "summary": "Professional summary"
}

Important: Return ONLY the JSON object, no additional text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up the response
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const extractedData = JSON.parse(jsonText);
      
      return {
        success: true,
        data: extractedData
      };
    } catch (error) {
      console.error('Error extracting from CV sections with Gemini:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

module.exports = new GeminiService();
