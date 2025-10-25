# FirstRead LLC Document Agent

A Django-based document generation agent using Pydantic AI for intelligent document creation through conversational interactions.

## Project Structure

```
FirstReadLLCDocumentAgent/
├── .venv/                          # UV virtual environment
├── .vscode/
│   ├── launch.json                 # VS Code debugger configurations
│   └── settings.json               # VS Code workspace settings
├── docgen/                         # Django project directory
│   ├── manage.py                   # Django management script
│   ├── chatbot/                    # Django app for chatbot functionality
│   │   ├── mock/
│   │   │   └── orchestrator.py     # Original mock implementation
│   │   ├── models.py
│   │   ├── views.py
│   │   └── ...
│   └── docgen/                     # Django project settings
│       ├── settings.py             # Django settings with Channels support
│       ├── asgi.py                 # ASGI configuration for WebSockets
│       └── ...
├── llm.py                          # Real LLM implementation using Pydantic AI
├── test_llm.py                     # Test script for LLM functionality
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## Setup Instructions

### 1. UV Virtual Environment

The project uses UV for fast package management. The virtual environment is already created at `.venv/`.

To activate the environment manually:
```powershell
.\.venv\Scripts\activate
```

### 2. Environment Variables

1. Copy the environment template:
   ```powershell
   copy .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional
   GOOGLE_API_KEY=your_google_api_key_here        # Optional
   ```

### 3. Install Dependencies

Dependencies are already installed, but if you need to reinstall:
```powershell
uv pip install -r requirements.txt
```

## VS Code Debugger Configurations

The project includes several pre-configured debug configurations in `.vscode/launch.json`:

### 1. **Debug Django Server**
- Runs the Django development server with debugging
- URL: http://127.0.0.1:8000
- Uses: `docgen/manage.py runserver`

### 2. **Debug Django with Channels (ASGI)**
- Runs Django with Channels for WebSocket support
- Uses: `uvicorn docgen.asgi:application`
- Supports real-time chat functionality

### 3. **Test LLM Module**
- Runs the test script without requiring API keys
- Good for testing the basic functionality
- File: `test_llm.py`

### 4. **Debug LLM Module**
- Runs the main LLM module directly
- Requires OpenAI API key in environment
- File: `llm.py`

### 5. **Debug Mock Orchestrator**
- Runs the original mock implementation
- File: `docgen/chatbot/mock/orchestrator.py`

### 6. **Debug Current File**
- Debugs whatever Python file is currently open
- Generic configuration for any file

### 7. **Debug Django Tests**
- Runs Django test suite with debugging
- Uses: `python manage.py test`

## Usage

### Running the Test (No API Key Required)

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Test LLM Module" from the dropdown
4. Press F5 to start debugging

### Running the Real LLM Implementation

1. Set up your `.env` file with OpenAI API key
2. Select "Debug LLM Module" from the debug dropdown
3. Press F5 to start
4. Follow the interactive prompts to generate documents

### Running the Django Server

1. Select "Debug Django Server" for basic HTTP server
2. Or select "Debug Django with Channels (ASGI)" for WebSocket support
3. Press F5 to start
4. Open http://127.0.0.1:8000 in your browser

## Key Features

### LLM Implementation (`llm.py`)

- **Real LLM Integration**: Uses Pydantic AI with OpenAI GPT-4
- **Structured Outputs**: Uses Pydantic models for type-safe responses
- **Streaming Support**: Streams document generation in real-time
- **Field Extraction**: Intelligently determines required fields
- **Context Awareness**: Acknowledges user input and maintains conversation flow
- **Error Handling**: Graceful fallbacks when LLM calls fail

### Document Types Supported

- Purchase Agreements
- Rental Agreements  
- Service Contracts
- Employment Contracts
- General Contracts

### Pydantic AI Features Used

- **Agents**: Specialized agents for different tasks (extraction, field mapping, generation)
- **Structured Output**: Type-safe document field extraction
- **Tool Functions**: Could be extended with tools for database access, validation, etc.
- **Streaming**: Real-time document generation
- **Model Agnostic**: Easy to switch between OpenAI, Anthropic, Google models

## Development Workflow

1. **Start with Tests**: Use "Test LLM Module" to verify basic functionality
2. **Add API Keys**: Set up `.env` for real LLM testing
3. **Debug Individual Components**: Use "Debug LLM Module" for standalone testing
4. **Integrate with Django**: Use Django debug configurations for full app testing
5. **WebSocket Testing**: Use ASGI configuration for real-time features

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure you're using the correct working directory in debug configurations
2. **API Key Errors**: Verify your `.env` file is set up correctly
3. **Django Errors**: Check that `DJANGO_SETTINGS_MODULE` is set to `docgen.settings`
4. **Channels Errors**: Ensure Redis is running for WebSocket support

### Debug Tips

- Use "Debug Current File" for quick testing of individual files
- Check the terminal output for detailed error messages
- Use breakpoints in VS Code to inspect variable values
- The `justMyCode` setting can be changed to `false` to debug into library code

## Next Steps

1. Integrate the real LLM implementation with Django views
2. Add WebSocket consumers for real-time document generation
3. Implement document storage and retrieval
4. Add user authentication and session management
5. Create a web interface for document generation
6. Add more document templates and types
7. Implement document validation and review workflows

## Technology Stack

- **Python**: 3.12.2
- **Django**: 5.2.7
- **Channels**: WebSocket support
- **Pydantic AI**: LLM integration framework
- **UV**: Fast Python package manager
- **VS Code**: IDE with comprehensive debug configurations
- **Redis**: Required for Channels (not yet set up)

## License

[Add your license information here]