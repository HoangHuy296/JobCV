const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const Setting = require('../models/Setting');
const aiProcessService = require('./aiProcessService');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.apiKey = null;
    this.model = null;
  }

  async initialize() {
    // Try to get API key from database settings first
    try {
      this.apiKey = await Setting.getValue('GEMINI_API_KEY', 'AI', process.env.GEMINI_API_KEY);
      this.model = await Setting.getValue('GEMINI_MODEL', 'AI', 'gemini-1.5-flash');
      
      if (!this.apiKey) {
        console.warn('GEMINI_API_KEY not found in settings or environment variables');
        this.genAI = null;
      } else {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
      }
    } catch (error) {
      console.error('Error initializing GeminiService from settings:', error);
      // Fallback to environment variable
      this.apiKey = process.env.GEMINI_API_KEY;
      this.model = 'gemini-1.5-flash';
      if (this.apiKey) {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
      }
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
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
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
