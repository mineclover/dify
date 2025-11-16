# Weather API Custom Node

A sample custom node that fetches weather data from OpenWeatherMap API.

## Features

- Fetches current weather for any city
- Supports metric, imperial, and standard temperature units
- Returns temperature, humidity, and description
- Full error handling and validation

## Configuration

### Inputs

- **City Name** (required): Name of the city to get weather for
- **API Key** (required): Your OpenWeatherMap API key
- **Temperature Units**: Choose between Metric (°C), Imperial (°F), or Standard (K)

### Outputs

- `temperature` (number): Current temperature
- `feels_like` (number): Feels like temperature
- `humidity` (number): Humidity percentage
- `description` (string): Weather description (e.g., "clear sky")
- `weather_data` (object): Full weather data object from the API

## Getting an API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Generate an API key
4. Paste it in the "API Key" field

## Example Usage

1. Add the Weather API node to your workflow
2. Enter a city name (e.g., "London")
3. Enter your OpenWeatherMap API key
4. Select temperature units
5. Connect to subsequent nodes using the output variables

Example output usage:
```
The weather in London is {{weather-api.description}} with a temperature of {{weather-api.temperature}}°C
```

## Error Handling

The node handles various error cases:
- Invalid city name
- Missing API key
- API request failures
- Network timeouts
- Invalid API responses

## Dependencies

Backend:
- `requests>=2.31.0`

Frontend:
- `react`
- `immer`

## File Structure

```
weather-api/
├── manifest.json          # Node metadata
├── backend/
│   ├── __init__.py
│   └── node.py           # Python implementation
└── frontend/
    ├── index.ts          # Export entry point
    ├── types.ts          # TypeScript types
    ├── node.tsx          # Canvas component
    ├── panel.tsx         # Config panel
    ├── use-config.ts     # Configuration hook
    └── default.ts        # Default values & validation
```

## License

MIT
