
import json
from groq import Groq

from app.core.config import settings
from app.voice.agent import create_llm_context
from app.voice.tools import check_doctor_availability


def main():
    print("\n--- TEST: GROQ FUNCTION CALLING ---")

    client = Groq(api_key=settings.GROQ_API_KEY)
    context = create_llm_context()

    # Convert Pipecat's registered tool schemas to API format.
    tools = [
    {
        "type": "function",
        "function": tool.to_default_dict(),
    }
    for tool in context.tools.standard_tools
]

    messages = [
        {
            "role": "system",
            "content": (
                "You are a doctor appointment assistant. "
                "Use check_doctor_availability to find real available slots. "
                "Never invent doctors or appointment slots."
            ),
        },
        {
            "role": "user",
            "content": (
                "Find available cardiologists on 2026-11-18."
            ),
        },
    ]

    print("Sending request to Groq...")

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=0,
    )

    message = response.choices[0].message

    if not message.tool_calls:
        print("Groq did not request a tool call.")
        print("Response:", message.content)
        return

    for tool_call in message.tool_calls:
        function_name = tool_call.function.name
        arguments = json.loads(tool_call.function.arguments)

        print("\nGroq selected tool:", function_name)
        print("Arguments:", arguments)

        if function_name != "check_doctor_availability":
            raise RuntimeError(f"Unexpected tool: {function_name}")

        # Execute the existing JSON-backed availability service.
        result = check_doctor_availability(**arguments)

        print("\n--- REAL AVAILABILITY RESULT ---")
        print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
