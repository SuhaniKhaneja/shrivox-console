import { Injectable } from '@nestjs/common';
import { Category, Priority } from '@prisma/client';

import { gemini } from './config/gemini.config';

@Injectable()
export class AiService {
  private readonly model = 'models/gemini-3.6-flash';

  async categorize(
    title: string,
    description: string,
  ): Promise<Category> {
    try {
      const response = await gemini.models.generateContent({
        model: this.model,
        contents: `
Classify this support ticket into exactly ONE category.

Allowed categories:
GENERAL
ACCOUNT
BILLING
TECHNICAL
OTHER

Title:
${title}

Description:
${description}

Return ONLY the category name.
`,
      });

      const result = response.text?.trim().toUpperCase();

      if (
        result &&
        Object.values(Category).includes(result as Category)
      ) {
        return result as Category;
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    }

    return Category.GENERAL;
  }

  async predictPriority(
    title: string,
    description: string,
  ): Promise<Priority> {
    try {
      const response = await gemini.models.generateContent({
        model: this.model,
        contents: `
Determine the priority of this support ticket.

Allowed priorities:
LOW
MEDIUM
HIGH
URGENT

Title:
${title}

Description:
${description}

Return ONLY the priority name.
`,
      });

      const result = response.text?.trim().toUpperCase();

      if (
        result &&
        Object.values(Priority).includes(result as Priority)
      ) {
        return result as Priority;
      }
    } catch (error) {
      console.error('AI priority prediction failed:', error);
    }

    return Priority.MEDIUM;
  }

  async summarize(
    title: string,
    description: string,
    comments: string,
  ): Promise<string> {
    try {
      const response = await gemini.models.generateContent({
        model: this.model,
        contents: `
Summarize this support ticket in 2-3 concise sentences.

Title:
${title}

Description:
${description}

Comments:
${comments || 'No comments yet.'}

Return ONLY the summary.
`,
      });

      return response.text?.trim() || 'Unable to generate summary.';
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return 'Unable to generate summary.';
    }
  }

  async generateReply(
    title: string,
    description: string,
    comments: string,
  ): Promise<string> {
    try {
      const response = await gemini.models.generateContent({
        model: this.model,
        contents: `
You are a professional customer support agent.

Write a helpful, concise support reply for this ticket.

Ticket title:
${title}

Ticket description:
${description}

Conversation/comments:
${comments || 'No previous comments.'}

Rules:
- Be professional and empathetic.
- Directly address the customer's issue.
- Do not invent policies, refunds, timelines, or actions that are not provided.
- Keep the response concise.
- Return ONLY the reply text.
`,
      });

      return (
        response.text?.trim() ||
        'Unable to generate a support reply.'
      );
    } catch (error) {
      console.error('AI reply generation failed:', error);
      return 'Unable to generate a support reply.';
    }
  }
}