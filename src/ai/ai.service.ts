import { Injectable } from '@nestjs/common';
import { gemini } from './config/gemini.config';

@Injectable()
export class AiService {
  async test(prompt: string) {
    const response = await gemini.models.generateContent({
      model: 'models/gemini-3.6-flash',
      contents: prompt,
    });

    return {
      response: response.text,
    };
  }
}