"""
Weather API Node

Fetches weather data from OpenWeatherMap API.
"""

import requests
from typing import Any

from dify_custom_nodes import BaseCustomNode, register_node, NodeRunResult
from dify_custom_nodes.types import VarType, WorkflowNodeExecutionStatus


@register_node('weather-api', version='1', author='Dify Custom Nodes')
class WeatherAPINode(BaseCustomNode):
    """
    Fetch weather data from OpenWeatherMap API

    This node demonstrates:
    - External API calls
    - Error handling
    - Multiple output variables
    - Input validation
    """

    @classmethod
    def get_schema(cls):
        """Define configuration schema"""
        return {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "title": "City Name",
                    "description": "City to get weather for",
                    "minLength": 1
                },
                "api_key": {
                    "type": "string",
                    "title": "OpenWeatherMap API Key",
                    "description": "Get your API key from openweathermap.org",
                    "format": "password",
                    "minLength": 1
                },
                "units": {
                    "type": "string",
                    "title": "Temperature Units",
                    "description": "Temperature units for the response",
                    "enum": ["metric", "imperial", "standard"],
                    "default": "metric"
                }
            },
            "required": ["city", "api_key"]
        }

    @classmethod
    def get_output_vars(cls, payload=None):
        """Define output variables"""
        return [
            {
                "variable": "temperature",
                "type": VarType.NUMBER,
                "description": "Current temperature"
            },
            {
                "variable": "feels_like",
                "type": VarType.NUMBER,
                "description": "Feels like temperature"
            },
            {
                "variable": "humidity",
                "type": VarType.NUMBER,
                "description": "Humidity percentage"
            },
            {
                "variable": "description",
                "type": VarType.STRING,
                "description": "Weather description"
            },
            {
                "variable": "weather_data",
                "type": VarType.OBJECT,
                "description": "Full weather data object"
            }
        ]

    def validate_inputs(self, inputs: dict[str, Any]) -> tuple[bool, str | None]:
        """Validate inputs"""
        city = inputs.get('city', '').strip()
        api_key = inputs.get('api_key', '').strip()

        if not city:
            return False, "City name cannot be empty"

        if not api_key:
            return False, "API key is required"

        units = inputs.get('units', 'metric')
        if units not in ['metric', 'imperial', 'standard']:
            return False, f"Invalid units: {units}"

        return True, None

    def _run(self) -> NodeRunResult:
        """Execute weather API call"""
        # Get inputs
        city = self.get_input('city', '').strip()
        api_key = self.get_input('api_key', '').strip()
        units = self.get_input('units', 'metric')

        # Validate inputs
        is_valid, error_msg = self.validate_inputs({
            'city': city,
            'api_key': api_key,
            'units': units
        })

        if not is_valid:
            return {
                'status': WorkflowNodeExecutionStatus.FAILED,
                'inputs': {'city': city, 'units': units},
                'outputs': {},
                'error': error_msg
            }

        try:
            # Call OpenWeatherMap API
            weather_data = self._fetch_weather(city, api_key, units)

            # Extract data
            temperature = weather_data['main']['temp']
            feels_like = weather_data['main']['feels_like']
            humidity = weather_data['main']['humidity']
            description = weather_data['weather'][0]['description']

            return {
                'status': WorkflowNodeExecutionStatus.SUCCEEDED,
                'inputs': {
                    'city': city,
                    'units': units
                },
                'outputs': {
                    'temperature': temperature,
                    'feels_like': feels_like,
                    'humidity': humidity,
                    'description': description,
                    'weather_data': weather_data
                }
            }

        except requests.exceptions.RequestException as e:
            return {
                'status': WorkflowNodeExecutionStatus.FAILED,
                'inputs': {'city': city, 'units': units},
                'outputs': {},
                'error': f"API request failed: {str(e)}"
            }

        except KeyError as e:
            return {
                'status': WorkflowNodeExecutionStatus.FAILED,
                'inputs': {'city': city, 'units': units},
                'outputs': {},
                'error': f"Unexpected API response format: missing {str(e)}"
            }

        except Exception as e:
            return {
                'status': WorkflowNodeExecutionStatus.EXCEPTION,
                'inputs': {'city': city, 'units': units},
                'outputs': {},
                'error': f"Unexpected error: {str(e)}"
            }

    def _fetch_weather(self, city: str, api_key: str, units: str = 'metric') -> dict:
        """
        Fetch weather data from OpenWeatherMap API

        Args:
            city: City name
            api_key: OpenWeatherMap API key
            units: Temperature units (metric/imperial/standard)

        Returns:
            Weather data dictionary

        Raises:
            requests.exceptions.RequestException: If API call fails
        """
        url = "https://api.openweathermap.org/data/2.5/weather"

        params = {
            'q': city,
            'appid': api_key,
            'units': units
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        return response.json()
