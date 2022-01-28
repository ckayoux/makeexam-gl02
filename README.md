## Table of Contents
1. [General Info](#general-info)
2. [Authors](#authors)
3. [Deviations from specifications](#deviations-from-specifications)
4. [Technologies](#technologies)
5. [Installation](#installation)
6. [License](#License)
7. [FAQs](#faqs)


### General Info
***
This command prompt software will allow teachers to compose, view and compare exams in GIFT* format.
This format is used by the Moodle platform (https://docs.moodle.org/2x/fr/Format_GIFT). These tests can be taken from a large bank of certified questions. The software meets the needs of potentially novice users and also the constraints formulated in the specifications of the company: YellowTeam.


![Image text](https://i.ibb.co/JqSdR0X/Sans-titre-2.png)


## Authors
***
- Félix Houdebert
- Romain Philippe
- Gnouryarou Marc- Arthur Khadanga
- Ismaël Khaladi


## Deviations from specifications
***
SPEC 2,3,4,5,6 and NF_1 have been implemented as presented in the specification, subject to our understanding.

SPEC 2 has also been implemented. The software has a 'list questions' command that lists all the questions in the banks loaded in the software, with options to classify them or not, to restrict the units or even the pages in which they are found, or to search by type of question, by content or by title.
Viewing questions is implemented through another command, 'test question'.

On the other hand, we have taken the liberty of ignoring SPEC_1 (Authenticate over the life of a session) entirely.
Indeed, Topic B states that the utility will be present locally on the user's machine, not uploaded to a server.
It says: 'The main function will be for a teacher to assemble a set of questions to create an exam GIFT file (which will eventually be deposited on the exam server but this last aspect is not your responsibility).'
The implementation of password authentication and a session system therefore seemed unnecessary and more burdensome to the user than anything else, and we felt that the priority of this specification was low compared to the others.
Ms. Di Loretto confirmed that we should ignore this specification and advised us to see with you what could possibly replace it.
However, we think it would be relevant to consider a system of profiles that the user could create, modify and delete, and that would allow the user to have several environments with their own configuration, their own exported exam files, as well as their own generated vCards and visualizations.

Finally, although the software is currently able to handle the most common types of questions, there are still two question formats that our parser does not support.
These are the "SHORT ANSWER" and "MULTICHOICE" questions with nested answers, i.e., those with several "sub-questions".
As it stands, the program will not allow you to load a bank containing these questions.

Unit tests to verify the implementation of the essential features of the program have been prepared by our team.

A TODO.md file, keeping track of the implemented features, is being implemented and is still in progress.

The program allows you to load one or more question banks, and to create and/or load an exam.
Once loaded, the exam can be modified by adding questions (among those loaded), and by deleting or swapping questions.
Editing the exam can be done quickly using a succession of single function commands (list questions; add questions 3,4 to the exam; delete the 2nd question from the exam; check the exam),
or in a more intelligible way by using an interactive menu allowing to perform all these operations.

If you have any difficulties using the program, please contact us.

## Technologies
***
A list of technologies used within the project:
* [Caporal](https://www.npmjs.com/package/caporal): Version 2.0.2 
* [es6-lib](https://www.npmjs.com/package/es6-lib): Version 0.1.1
* [gift-pegjs](https://www.npmjs.com/package/gift-pegjs): Version 0.2.1
* [npm](https://www.npmjs.com): Version 8.1.4
* [prompt-sync](https://www.npmjs.com/package/prompt-sync): Version 4.2.0
* [sexy-require](https://www.npmjs.com/package/sexy-require): Version 1.1.2
* [vcard-js](https://www.npmjs.com/package/vcard-js): Version 1.2.2
* [vcards-js](https://www.npmjs.com/package/vcards-js): Version 2.10.0
* [vega](https://www.npmjs.com/package/vega): Version 5.21.0
* [vega-lite](https://www.npmjs.com/package/vega-lite): Version 5.2.0


## Installation
***
MakeExam uses a minimum version of npm and node JS in order to use functions.
**You must have at least version 6.0.0 of npm and 15.0.0 for node.**
To check your version of node Js, perform this command : 
$ npm -v 

When you have the minimum required versions of npm and node, you do this command: 
$ npm install

To see all the commands of the program, you can do this command :
$ node makeexam.js --help


## License
***
Copyright (c) 2021-2025 AubeDev 

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## FAQs
***
A list of frequently asked questions
1. **Can I get statistics on an exam?**
Yes, of course, we generate charts for you to better visualize and compare your exams.

2. **I am limited in the number of exams I can create ?**
No, you are not limited. You can create as many exams as you want !

3. **Can we generate a Vcard?**
Yes, of course, you just have to do :
$ node makeexam.js create vcard
