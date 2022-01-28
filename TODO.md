# Development progress : makeexam
This file keeps a track of the project's development's progress,
and lists the yet unfulfilled tasks.


## Todo
---------------------------------------------
### Banks
- [ ] Allow loading banks with unconventionnal namespaces.

### Exams
- [ ] Add options to manage loaded banks and exam in the *edit exam*'s command menu. 

### Questions
- [ ] !-- Enable loading, saving and running **embedded questions** (*MC* and *SA*) --!

### Parser
- [ ] Fix the parser's problem with semicolons inside blocks properly (instead of replacing them by '-').
- [ ] Take global feedbacks into account (even if SRU's questions don't use it).

### Charts
- [ ] Enhance the charts adding more information or others types of charts

### Vcards
- [ ] Enable adding a picture to the generated vCard

### Profiles
- [ ] Enable users to create a profile
- [ ] Save a profile's favorite config, generated exams, charts, vcards and imported banks



## In Progress
---------------------------------------------
- [ ] Test the functionnalities of the program with exceptionnal inputs

### Questions
- [ ] Test options combinations for the *list options* command and correct conflicts

### Chart
- [ ] Compare the profile of an exam with the average profile of the loaded questions bank


## Done ✓
---------------------------------------------
### Client-app
- [X] Define aliases based on shortcuts or synonyms of the avaliable commands
- [X] Reorganize the *help* command for a better readability

### Banks
- [x] Load banks from gift files
- [x] Classify banks by units and page numbers
- [X] Unload one or plural banks
- [X] Import a bank (with a conventionnal namespace) given its path

### Exam
- [x] Create an exam
- [x] Add questions to an exam
- [x] Check if questions are duplicated when adding
- [X] List the questions of an exam
- [X] Classify the questions of an exam by unit and page number
- [x] Remove questions from an exam
- [x] Swap two questions within
- [x] Check if an exam is regulatory
- [x] Enable deleting duplicated questions when running the check
- [X] Load an exam
- [X] Unload an exam
- [X] Export an exam
- [X] Remove an exam
- [X] Simulate the taking of an exam

### Charts
- [X] Export vizualizations of the profile of an exam or a bank
- [X] Compare two exams

### Questions
- [X] Load, run & save a Description
- [X] Load, run & save a Numerical question
- [X] Load, run & save a Short Answer question
- [X] Load, run & save a Multichoice question
- [X] Load, run & save a Match pairs question
- [X] Load, run & save a True/False question
- [X] List all the loaded questions (raw and classyfied display)
- [X] Filter avaliable questions by unit, page numbers or type.
- [X] Search a question by description, title, 

### vCard
- [X] Generate a vCard based on user-input informations

### Parser
- [X] Turn a gift text into an array of questions
- [X] Parse the name of banks in order to classify them
- [X] Parse the name of questions in order to classify them

### Utils
- [X] Serialize one or plural objects for temporary use and modification
- [X] Unserialize one or plural objects
- [X] Define simple and synchronous functions for copying & removing a file, checking if it exists, dealing with its extensions and basename, writing to it, reading from it,  and hecking if it is empty or not.
- [X] Define simple and synchronous functions for getting input from the user (yes-no questions, custom invite, integer-only input) and displaying separators.
- [X] Define a function for computing two arrays' intersection.
