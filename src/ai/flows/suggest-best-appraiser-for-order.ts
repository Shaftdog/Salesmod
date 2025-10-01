'use server';

/**
 * @fileOverview An AI agent that suggests the best appraiser for a new order.
 *
 * - suggestBestAppraiserForOrder - A function that suggests the best appraiser for an order.
 * - SuggestBestAppraiserForOrderInput - The input type for the suggestBestAppraiserForOrder function.
 * - SuggestBestAppraiserForOrderOutput - The return type for the suggestBestAppraiserForOrder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBestAppraiserForOrderInputSchema = z.object({
  propertyAddress: z.string().describe('The address of the property to be appraised.'),
  propertyCity: z.string().describe('The city of the property to be appraised.'),
  propertyState: z.string().describe('The state of the property to be appraised.'),
  propertyZip: z.string().describe('The zip code of the property to be appraised.'),
  orderPriority: z.enum(['rush', 'high', 'normal', 'low']).describe('The priority of the order.'),
  orderType: z
    .enum(['purchase', 'refinance', 'home_equity', 'estate', 'divorce', 'tax_appeal', 'other'])
    .describe('The type of the order.'),
  appraisers: z
    .array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      availability: z.boolean().describe('Whether the appraiser is currently available to take on new orders.'),
      geographicCoverage: z.string().describe('The geographic area the appraiser covers.'),
      workload: z.number().describe('The current workload of the appraiser (e.g., number of active orders).'),
      rating: z.number().describe('The appraiser rating as a number between 1 and 5.'),
    }))
    .describe('A list of appraisers to consider.'),
});

export type SuggestBestAppraiserForOrderInput = z.infer<
  typeof SuggestBestAppraiserForOrderInputSchema
>;

const SuggestBestAppraiserForOrderOutputSchema = z.object({
  appraiserId: z.string().uuid().describe('The ID of the suggested appraiser.'),
  reason: z.string().describe('The reason why this appraiser was selected.'),
});

export type SuggestBestAppraiserForOrderOutput = z.infer<
  typeof SuggestBestAppraiserForOrderOutputSchema
>;

export async function suggestBestAppraiserForOrder(
  input: SuggestBestAppraiserForOrderInput
): Promise<SuggestBestAppraiserForOrderOutput> {
  return suggestBestAppraiserForOrderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBestAppraiserForOrderPrompt',
  input: {schema: SuggestBestAppraiserForOrderInputSchema},
  output: {schema: SuggestBestAppraiserForOrderOutputSchema},
  prompt: `You are an expert in appraisal order assignment. Given the following order details and a list of appraisers, determine the best appraiser to assign the order to.

Order Details:
Property Address: {{{propertyAddress}}}, {{{propertyCity}}}, {{{propertyState}}} {{{propertyZip}}}
Order Priority: {{{orderPriority}}}
Order Type: {{{orderType}}}

Appraisers:
{{#each appraisers}}
- Name: {{{name}}}, ID: {{{id}}}, Availability: {{#if availability}}Yes{{else}}No{{/if}}, Geographic Coverage: {{{geographicCoverage}}}, Workload: {{{workload}}}, Rating: {{{rating}}}
{{/each}}

Consider the appraiser's availability, geographic coverage, workload, and rating when making your decision. The geographic coverage should include the property address city and state. Choose the appraiser with the lowest workload who serves the correct geographic region, and who is available.

Return the appraiser ID and a brief reason for your selection.

Ensure the output is valid JSON and nothing else.`, //Crucially, you MUST NOT attempt to directly call functions, use `await` keywords, or perform any complex logic _within_ the Handlebars template string.
});

const suggestBestAppraiserForOrderFlow = ai.defineFlow(
  {
    name: 'suggestBestAppraiserForOrderFlow',
    inputSchema: SuggestBestAppraiserForOrderInputSchema,
    outputSchema: SuggestBestAppraiserForOrderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
