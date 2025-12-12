# AI Usage for Question Service

file /ai/usage-log-question-service.md.

# Date:
2025‑10-05, 2025‑10-25, 2025‑11-08 (among others)

# Tool:
ChatGPT 5 Thinking

# Prompt/Command:
Provided prompts containing written API specifications and generated code snippets for implementing the Question Service microservice.

Implementation was generated for almost every component of the Question Service, including routing, utils, unit testing, etc.

Debugging was also performed with the assistance of ChatGPT 5 with error logs provided.

Example:
```
Use the following API endpoint specifications to generate implementation for the routes for the question service.
Endpoint	HTTP Method	Description	Authentication	Request Params/Body/Example
/	POST	Add one question to the database.	Admin only	"{ ""title"": ""Reverse a Linked List"", 
  ""description"": ""Given the head of a singly linked list, reverse the list."", 
  ""difficulty"": ""medium"", 
  ""category"": ""data_structures"", 
  ""examples"": [{ ""input"": ""[1,2,3,4,5]"", ""output"": ""[5,4,3,2,1]"" }], 
  ""function_name"": ""reverseList"", 
  ""function_params"": [""head""] }"
/batch	POST	Add multiple questions to the database. (Not implemented yet)	Admin only	
/edit/:id	PATCH	Edits a specific question by given ID. Replaces the specified field with the new input. All fields are optional.	Admin only	"{ ""title"": ""Reverse a Linked List (Iterative)"", 
  ""difficulty"": ""medium"", 
  ""category"": ""data_structures"", 
  ""function_name"": ""reverseListIterative"", 
  ""function_params"": [""head""] }"
/delete/:id	DELETE	Deletes a specific question by given ID.	Admin only	
/randomQuestion	GET	Fetches a random question with filters on difficulty/category if provided. Avoids returning questions that users have already completed. Returns only the ID of the question.		"Parameters: difficulty, category, user1, user2
Example Request: /randomQuestion?user1=68fe41e75d7a10214d7815e6&user2=68fe420c5d7a10214d7815ee&difficulty=medium&category=linked list
Response: json { ""id"": ""68fcfb558b75372716e3b1a4"" }"
/:id	GET	Fetches a specific question by ID. Returns all details of the question.		
/:id/template	GET	"Fetches a specific question by ID and provides the function signature and definition for any complex classes provided (such as linked lists).

Currently supported languages are python, java, cpp"		"Parameters: lang
Example Request: /68fcfb558b75372716e3b1a4/template?lang=java
Response: {
    ""signature"": ""public ListNode mergeTwoLists(ListNode l1, ListNode l2)"",
    ""definitions"": ""class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int val) { this.val = val; }\n}""
}"
```

# Output Summary:
Generated code snippets and explanations for implementing the Question Service microservice using the provided specifications.

# Action Taken:
Accepted and modified output as required. Each generated code snippet was reviewed for correctness and integrated into implementation, and was modified along with updating requirements and specifications.

# Author Notes:
There were too many interactions to log each individually, so the above is a summary of the overall AI usage for this microservice.

Each file involving AI assistance has a header attribution comment indicating scope and usage of AI assistance.