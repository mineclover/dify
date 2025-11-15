# Agno Agent Node

Execute [Agno AgentOS](https://docs.agno.com/) agents directly in Dify workflows with full support for session management, streaming responses, and comprehensive error handling.

## Features

- 🤖 **Direct Agent Execution** - Connect to any deployed Agno AgentOS agent
- 🔐 **Bearer Token Authentication** - Secure API key authentication
- 💬 **Session Management** - Multi-turn conversations with automatic session handling
- 🌊 **Streaming Support** - Real-time SSE (Server-Sent Events) responses
- 🔗 **Variable Integration** - Full support for Dify workflow variables
- ⚡ **Timeout Control** - Configurable timeouts (1-300 seconds)
- 📊 **Detailed Outputs** - Run ID, status, execution time, and error messages
- 🛡️ **Error Handling** - Comprehensive HTTP status code handling with user-friendly messages

## Installation

This node is part of the dify-patcher custom nodes collection. Install it using the installer CLI:

```bash
# Development mode (symlinks)
dify-install install -t /path/to/dify -m dev

# Docker mode (copy files)
dify-install install -t /path/to/dify -m docker
```

See [installer/cli/README.md](../../installer/cli/README.md) for detailed installation instructions.

## Configuration

### Inputs

#### Required Fields

- **Agno Base URL** (`agno_base_url`)
  - Type: `string`
  - Description: Base URL of your Agno AgentOS instance
  - Example: `https://your-agno.com`
  - Format: URI (automatically strips trailing slash)

- **Agent ID** (`agent_id`)
  - Type: `string`
  - Description: Identifier of the agent to execute
  - Example: `my-agent`
  - Note: Must match an existing agent deployed on your Agno instance

- **API Key** (`api_key`)
  - Type: `string` (password)
  - Description: Bearer token for authentication (AgentOS Security Key)
  - Example: `sk_abc123...`
  - Security: Use environment variables - `{{#env.AGNO_API_KEY#}}`

- **Message** (`message`)
  - Type: `string`
  - Description: Message to send to the agent
  - Variable Support: Yes (e.g., `{{#sys.query#}}`, `{{#1234.output#}}`)
  - Example: `Analyze this data: {{#start.user_input#}}`

#### Optional Fields

- **Session ID** (`session_id`)
  - Type: `string`
  - Description: Session identifier for conversation context
  - Default: Auto-generated UUID if not provided
  - Variable Support: Yes
  - Example: `{{#sys.conversation_id#}}` to maintain Dify session

- **User ID** (`user_id`)
  - Type: `string`
  - Description: User identifier for tracking and analytics
  - Variable Support: Yes
  - Example: `{{#sys.user_id#}}` for Dify user tracking

- **Enable Streaming** (`stream`)
  - Type: `boolean`
  - Description: Enable Server-Sent Events (SSE) streaming
  - Default: `false`
  - Note: When enabled, responses stream in real-time but are accumulated for workflow output

- **Timeout** (`timeout`)
  - Type: `number`
  - Description: Request timeout in seconds
  - Default: `60`
  - Range: `1-300`
  - Example: `120` for longer-running agents

### Outputs

- **response** (`string`)
  - Agent's response text
  - For streaming: Complete accumulated response

- **run_id** (`string`)
  - Agno run identifier for this execution
  - Use for tracking and debugging in Agno dashboard

- **session_id** (`string`)
  - Session ID used for this run
  - Same as input if provided, or the auto-generated UUID

- **status** (`string`)
  - Execution status: `success`, `failed`, or `timeout`
  - Use for conditional workflow logic

- **execution_time** (`number`)
  - Execution time in milliseconds
  - Includes network latency and agent processing time

- **error_message** (`string`)
  - Error description if execution failed
  - Empty string on success

## Usage

### Basic Example

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Start     │────▶│ Agno Agent   │────▶│   Answer    │
│ user_input  │     │ execute      │     │  response   │
└─────────────┘     └──────────────┘     └─────────────┘
```

**Configuration:**
- Agno Base URL: `https://your-agno.com`
- Agent ID: `customer-support-agent`
- API Key: `{{#env.AGNO_API_KEY#}}`
- Message: `{{#start.user_input#}}`

**Result:**
- Agent processes the user input and returns a response
- Response available at `{{#agno-node.response#}}`

### Multi-Turn Conversation

Maintain conversation context across multiple interactions:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│   Start     │────▶│ Agno Agent   │────▶│ Agno Agent   │────▶│   Answer    │
│  question1  │     │ (Turn 1)     │     │ (Turn 2)     │     │  response   │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                           │                     ▲
                           └────session_id───────┘
```

**First Turn Configuration:**
- Session ID: `{{#sys.conversation_id#}}`
- Message: `What are the benefits of your product?`

**Second Turn Configuration:**
- Session ID: `{{#agno-1.session_id#}}` (reuse from first turn)
- Message: `Tell me more about pricing`

**Result:**
- Agent maintains context from first turn
- Can reference previous conversation history

### Streaming Responses

Enable real-time streaming for long-running agents:

**Configuration:**
- Enable Streaming: `true`
- Timeout: `120` (allow more time)

**Result:**
- Agent response streams in real-time via SSE
- Complete response accumulated in `{{#agno-node.response#}}`
- Lower perceived latency for end users

### Conditional Workflow

Handle errors gracefully with conditional logic:

```
┌──────────────┐
│ Agno Agent   │
└──────┬───────┘
       │
       ├─ if status == "success" ──▶ Process Response
       │
       └─ if status == "failed" ───▶ Fallback Action
```

**Condition Example:**
- Use `{{#agno-node.status#}}` in conditional node
- Check `{{#agno-node.error_message#}}` for error details

## Advanced Usage

### Environment Variables

Store sensitive credentials in Dify environment variables:

1. Add to `.env`:
   ```env
   AGNO_API_KEY=sk_abc123xyz...
   AGNO_BASE_URL=https://your-agno.com
   ```

2. Reference in node:
   - API Key: `{{#env.AGNO_API_KEY#}}`
   - Base URL: `{{#env.AGNO_BASE_URL#}}`

### Error Handling

The node provides detailed error messages for debugging:

| HTTP Status | Error Message | Recommended Action |
|-------------|---------------|-------------------|
| 401 | Authentication failed. Check your API key. | Verify API key is correct |
| 404 | Agent '{agent_id}' not found. | Check agent ID and deployment |
| 422 | Validation error: {detail} | Fix input parameters |
| 500+ | Agno server error. Please try again later. | Check Agno server status |
| Timeout | Request timed out after {timeout} seconds | Increase timeout or optimize agent |
| Connection | Failed to connect to {url}. Check the URL and network. | Verify network and URL |

### Monitoring and Logging

Use output variables for monitoring:

```python
# In workflow logic node (example)
execution_time = {{#agno-node.execution_time#}}
if execution_time > 5000:  # 5 seconds
    log("Slow agent execution: " + {{#agno-node.run_id#}})
```

Track run IDs in Agno dashboard for debugging and analytics.

## API Endpoint

This node connects to the Agno AgentOS API:

```
POST {agno_base_url}/agents/{agent_id}/runs
Authorization: Bearer {api_key}
Content-Type: multipart/form-data

Body (form-data):
- message: string (required)
- stream: "true" | "false" (optional)
- session_id: string (optional)
- user_id: string (optional)
- files: file[] (future support)
```

**Response (JSON):**
```json
{
  "content": "Agent response text",
  "run_id": "run_abc123",
  "session_id": "session_xyz"
}
```

**Response (SSE):**
```
data: {"content": "First ", "run_id": "run_abc123"}
data: {"content": "chunk", "run_id": "run_abc123"}
data: [DONE]
```

For detailed API documentation, see [Agno AgentOS API Docs](https://docs.agno.com/agent-os/api).

## Common Issues

### Authentication Errors

**Problem:** `Authentication failed. Check your API key.`

**Solutions:**
1. Verify API key format: `sk_...`
2. Check environment variable is set: `{{#env.AGNO_API_KEY#}}`
3. Ensure API key has not expired
4. Verify API key has permissions for the agent

### Agent Not Found

**Problem:** `Agent '{agent_id}' not found.`

**Solutions:**
1. Check agent is deployed on Agno instance
2. Verify agent ID matches exactly (case-sensitive)
3. Ensure you're using the correct base URL
4. Check agent is not archived or deleted

### Timeout Errors

**Problem:** `Request timed out after 60 seconds`

**Solutions:**
1. Increase timeout value (up to 300 seconds)
2. Optimize agent performance in Agno
3. Check for network latency issues
4. Enable streaming for better perceived performance

### Connection Errors

**Problem:** `Failed to connect to https://your-agno.com`

**Solutions:**
1. Verify base URL is correct (including protocol)
2. Check network connectivity
3. Ensure firewall allows outbound HTTPS
4. Verify Agno instance is running

## Security Best Practices

1. **Never hardcode API keys** - Always use environment variables
   ```
   ✓ Good: {{#env.AGNO_API_KEY#}}
   ✗ Bad: sk_abc123xyz... (hardcoded)
   ```

2. **Use HTTPS** - Never use HTTP for production
   ```
   ✓ Good: https://your-agno.com
   ✗ Bad: http://your-agno.com
   ```

3. **Rotate API keys regularly** - Update keys periodically for security

4. **Limit key permissions** - Use agent-specific keys when possible

5. **Monitor usage** - Track run IDs and execution patterns

## Performance Tips

1. **Enable streaming** for long-running agents to reduce perceived latency

2. **Reuse sessions** for multi-turn conversations to maintain context efficiently

3. **Set appropriate timeouts** - Balance reliability vs. responsiveness
   - Quick queries: 30 seconds
   - Complex analysis: 120+ seconds

4. **Cache common responses** - Use Dify's caching for frequently asked questions

5. **Monitor execution times** - Use `{{#agno-node.execution_time#}}` to identify slow agents

## Dependencies

### Backend

- **requests** - HTTP client for API calls and SSE streaming
  ```bash
  pip install requests
  ```

### Frontend

- **react** - UI framework
- **immer** - State management
- **@dify/ui-components** - Field, Input, VarReferencePicker, Switch, InputNumber, Collapse

## Integration Examples

### With LLM Node

Process Agno agent responses with additional LLM analysis:

```
Agno Agent ──▶ LLM Node ──▶ Answer
{{#agno.response#}}    Analyze and summarize
```

### With Code Node

Post-process agent responses programmatically:

```python
agent_response = {{#agno.response#}}
response_length = len(agent_response)
return {"processed": agent_response.upper()}
```

### With Conditional Node

Route based on agent execution status:

```
Agno Agent ──▶ IF Node
              ├─ status == "success" ──▶ Success Path
              └─ status == "failed" ───▶ Error Handler
```

## Development

### Testing Locally

1. Deploy an agent on Agno AgentOS
2. Get API key from Agno dashboard
3. Add to Dify environment:
   ```env
   AGNO_API_KEY=sk_test_...
   AGNO_BASE_URL=https://test.agno.com
   ```
4. Create workflow with Agno Agent node
5. Test with sample messages

### Debugging

Enable verbose logging in backend (`node.py`):

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check browser console for frontend errors in panel configuration.

## Changelog

### v1.0.0 (2025-01-15)

- Initial release
- Full Agno AgentOS API integration
- Session management support
- SSE streaming support
- Comprehensive error handling
- Rich UI panel with variable pickers

## Contributing

Contributions welcome! Please follow these guidelines:

1. Maintain backward compatibility
2. Add tests for new features
3. Update documentation
4. Follow existing code style

## License

MIT

## Resources

- [Agno AgentOS Documentation](https://docs.agno.com/)
- [Agno API Reference](https://docs.agno.com/agent-os/api)
- [Dify Custom Nodes Guide](../../README.md)
- [Dify Official Documentation](https://docs.dify.ai/)

## Support

For issues or questions:

1. Check [Common Issues](#common-issues) section
2. Review [Agno AgentOS Docs](https://docs.agno.com/)
3. Open an issue in the dify-patcher repository
4. Contact Agno support for agent-specific issues
