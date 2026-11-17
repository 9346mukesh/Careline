
from app.voice.agent import create_groq_llm, create_llm_context

print("\n--- TEST 1: GROQ INITIALIZATION ---")
llm = create_groq_llm()
print("Groq initialized:", type(llm).__name__)

print("\n--- TEST 2: LLM CONTEXT ---")
context = create_llm_context()
print("Context created successfully")

print("\n--- TEST 3: REGISTERED TOOLS ---")

for tool in context.tools.standard_tools:
    print(f"Tool: {tool.name}")
    print(f"Required parameters: {tool.required}")
    print(f"Parameters: {list(tool.properties.keys())}")
    print("-" * 40)

print("\nAll initialization tests passed!")

print("\nAll initialization tests completed!")
