# Tax Litigation CoPilot

An AI-powered decision support tool for tax officers to reduce unnecessary litigation by predicting appeal outcomes.

## Overview

Tax Litigation CoPilot helps tax officers make informed decisions about whether to appeal tax cases by:

- Analyzing case documents to extract key legal issues
- Predicting the likelihood of success on appeal
- Providing legal reasoning based on precedents
- Generating clear recommendations

## Project Structure

```
/tax-litigation-copilot/
├── frontend/                  # Next.js + shadcn/ui
│   ├── src/
│   │   ├── app/               # App router
│   │   ├── components/        # UI components
│   │   ├── lib/               # Utility functions
│   │   └── styles/            # Global styles
├── backend/                   # Node.js/Express backend
│   ├── services/              # Business logic
│   ├── prompts/               # System prompts
│   └── server.js              # Express server
```

## Features

- **Document Upload**: Upload tax case documents (PDF, DOC, DOCX, TXT)
- **Case Analysis**: AI analyzes case against historical precedents
- **Prediction Engine**: Forecasts higher court ruling probability
- **Legal Reasoning**: Provides case-specific legal reasoning
- **Recommendation System**: Suggests whether to appeal or not
- **Dashboard**: View and track case analyses

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following:
   ```
   PORT=3001
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and go to `http://localhost:3000`

## Technology Stack

- **Frontend**: Next.js, shadcn/ui, TailwindCSS
- **Backend**: Node.js, Express
- **AI**: OpenAI API for text analysis and generation

## The Problem

In the Indian judicial system, tax authorities appeal 90% of cases they lose, yet win fewer than 10% of these appeals. This flood of low-merit litigation paralyzes the entire system, causing delays and wasting resources.

## The Solution

Tax Litigation CoPilot provides objective, data-driven recommendations to help tax officers:

- Reduce unnecessary appeals that have low chances of success
- Identify high-value cases that are worth pursuing
- Save time and resources by focusing on merit-based litigation
