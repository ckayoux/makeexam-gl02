#!/usr/bin/node
const prompt = require('prompt-sync')({
    sigint: true
});

const conventions = {
    regExp: new RegExp(/(([A-Z]* )?U[0-9]+)( p([0-9]+))?(\-[0-9]+ | )?(.*)/),
    parseUnit: (str) => conventions.regExp.exec(str)[1],
    parsePageNumber: (str) => conventions.regExp.exec(str)[4],
    parseId: (str) => conventions.regExp.exec(str)[6],
    parseTitle: (str) => {
        return {
            id: conventions.parseId(str),
            pageNumber: conventions.parsePageNumber(str),
            unit: conventions.parseUnit(str),
            isConventionnal: (conventions.regExp.exec(str)[0] === str)
        }
    }
}

const qTypes = {
    MULTI_CHOICE: 'MC',
    DESCRIPTION: 'Description',
    SHORT_ANSWER: 'Short',
    TRUE_FALSE: 'TF',
    NUMERICAL: 'Numerical',
    MATCHING: 'Matching'
}

const formats = {
    CLOZE: 'moodle',
    HTML: 'html'
}

class Question {
   refs = {
        id: null,
        pageNumber: null,
        unit: null,
        exercise: null,
        bankDescription: null
    }

    matchPairs
    isConventionnal
    title
    type
    text
    format
    choices
    key = null

    constructor(qid, p, bankUnit, qType, qText, qChoices, format, key) {
        this.title = `${bankUnit} ` + ((p !== undefined) ? `p${p} ` : "")
            + `${qid}`
        this.isConventionnal = (conventions.parseTitle(this.title).isConventionnal)
        this.refs.id = qid
        this.refs.pageNumber = (p) ? parseInt(p) : p
        this.refs.unit = bankUnit

        this.type = qType
        this.text = qText
        this.choices = qChoices
        this.format = format

        this.key = (key) ? parseInt(key) : key
    }

    isDescription = () => {
        return (this.type === qTypes.DESCRIPTION)
    }

    hasPluralBlanks = () => {
        return false //temporary, must return true for a question like ::EM U5 p38 Gra2 passive forms::
    }

    toGift = () => {
        let giftStr = `::${this.title}::`
        let matchesFillTheBlank = () => {
            if (!giftStr.match(/ _{5} /)) return false
            else return (giftStr.match(/ _{5} /)[0] !== null)
        }
        switch (this.type) {
            case qTypes.DESCRIPTION:
                giftStr += this.text
                break

            case qTypes.MULTI_CHOICE:
                giftStr += this.text
                if (matchesFillTheBlank())
                    giftStr = giftStr.replace(/ _____ /, " {\n\t" + this.choices.map(c => c.toGift()).join('\n\t') + "\n} ")
                else
                    giftStr += this.text + " {\n\t" + this.choices.map(c => c.toGift()).join('\n\t') + "\n} " //\n?
                break

            case qTypes.SHORT_ANSWER:
                giftStr += this.text
                if (this.hasPluralBlanks()) {
                    let i = 0
                    do {
                        let choicesStr = " {"
                        choicesStr += ("points" in this.choices[i]) ? this.choices.points.toString() : ""
                        choicesStr += ":SA:"
                        choicesStr += this.choices[i].map(c => c.toGift()).join('') + "} "
                        giftStr = giftStr.replace(/ _____ /, choicesStr)
                        i++
                    } while (matchesFillTheBlank())
                } else {
                    if (matchesFillTheBlank()) { //the blank is in the middle of a sentence
                        giftStr = giftStr.replace(/ _____ /, "{\n\t" + this.choices.map(c => c.toGift()).join('\n\t') + "\n}")
                    } else {//the blank is at the end of the sentence
                        giftStr += " {\n\t" + this.choices.map(c => c.toGift()).join('\n\t') + "\n} "//\n?
                    }
                }
                break

            case qTypes.NUMERICAL:
                giftStr += " {#\n\t" + this.choices.map(c => c.toGift()).join('\n\t') + "\n} "
                break;

            case qTypes.TRUE_FALSE:
                giftStr += ' {\n\t'
                if (this.isCorrect) {
                    giftStr += `TRUE`
                    if (this.correctFeedback) {
                        giftStr += `#${this.correctFeedback}`
                        if (this.incorrectFeedback) giftStr += `\n\t#${this.incorrectFeedback}\n`
                    }
                } else {
                    giftStr += `FALSE`
                    if (this.incorrectFeedback) {
                        giftStr += `#${this.incorrectFeedback}`
                        if (this.correctFeedback) giftStr += `\n\t#${this.correctFeedback}\n`
                    }
                }
                giftStr += '} '
                break;

            case qTypes.MATCHING:
                giftStr += " {\n\t" + this.matchPairs.map(mp => `=${mp.subquestion} -> ${mp.subanswer}`).join('\n\t') + "\n} "
                break;

            default:
                console.log("!--Error : unknown question format--!")
        }
        return giftStr
    }
}

makeQuestion = (qTitle, qType, qText, qChoices, format, key) => {
    let parsedTitle = conventions.parseTitle(qTitle)
    return new Question(
        parsedTitle.id, parsedTitle.pageNumber, parsedTitle.unit,
        qType, qText, qChoices, format, key
    )
}

makeTFQuestion = (qTitle, qText, format, key, isTrue, incorrectFeedback, correctFeedback) => {
    let q = makeQuestion(qTitle, qTypes.TRUE_FALSE, qText, undefined, format, key)
    q.isTrue = isTrue
    q.incorrectFeedback = incorrectFeedback
    q.correctFeedback = correctFeedback
    return q
}


jsonToQuestion = (jsonQuestion) => {
    let q
    switch (jsonQuestion.type) {

        case qTypes.TRUE_FALSE:
            q = makeTFQuestion(jsonQuestion.title, jsonQuestion.text, jsonQuestion.format, jsonQuestion.key,
                jsonQuestion.isTrue, jsonQuestion.incorrectFeedback, jsonQuestion.correctFeedback)
            break;

        case qTypes.NUMERICAL:
            q = makeQuestion(jsonQuestion.title, jsonQuestion.type, jsonQuestion.text,
                jsonQuestion.choices.map(o => {
                    let feedback
                    if (o.feedback)
                        feedback = o.feedback.text
                    let c = new Choice(jsonQuestion.type, null, o.isCorrect, feedback, o.weight)
                    c.range = o.range
                    c.number = o.number
                    return c
                }),
                jsonQuestion.format, jsonQuestion.key)
            break;

        case qTypes.MATCHING:
            q = makeQuestion(jsonQuestion.title, jsonQuestion.type, jsonQuestion.text,
                undefined, jsonQuestion.format, jsonQuestion.key)
            q.matchPairs = jsonQuestion.matchPairs
            break;

        default:
            let choices
            if (jsonQuestion.choices) choices = jsonQuestion.choices.map(c => new Choice(c.type, c.text, c.isCorrect, c.feedback, c.weight))
            q = makeQuestion(jsonQuestion.title, jsonQuestion.type, jsonQuestion.text,
                choices, jsonQuestion.format, jsonQuestion.key)


    }
    return q
}

function classify(questions) {
    return questions.sort((q1, q2) => {
        if (q1.refs.unit > q2.refs.unit) return 1
        else if (q1.refs.unit < q2.refs.unit) return -1
        else return 0
    }).reduce((qDict, q) => {
        if (q.refs.unit) {
            if (!qDict[q.refs.unit]) {
                qDict[q.refs.unit] = {}
            }
            if (q.refs.pageNumber) {
                if (!qDict[q.refs.unit][q.refs.pageNumber]) {
                    qDict[q.refs.unit][q.refs.pageNumber] = []
                }
                qDict[q.refs.unit][q.refs.pageNumber].push(q)
            } else {
                if (!qDict[q.refs.unit]["??"]) {
                    qDict[q.refs.unit]["??"] = []
                }
                qDict[q.refs.unit]["??"].push(q)
            }
        }
        return qDict
    }, {})
}

class Choice {
    type
    isCorrect
    weight
    text
    range
    number
    feedback

    constructor(type, text, isCorrect, feedback, weight) {
        this.type = type
        this.isCorrect = isCorrect
        this.weight = weight
        this.text = text
        this.feedback = feedback
    }

    toGift = () => {
        let giftStr = ""
        switch (this.type) {

            case qTypes.NUMERICAL:
                if (this.isCorrect)
                    giftStr += "="
                if (this.weight) giftStr += `%${this.weight}%`
                giftStr += this.number
                if (this.range !== undefined) giftStr += `:${this.range}`
                break

            default:
                if (this.isCorrect) {
                    giftStr += "="
                } else {
                    giftStr += "~"
                    if (this.weight) giftStr += `%${this.weight}%`
                }
                giftStr += this.text
                if (this.feedback) giftStr += `#${this.feedback}`
        }
        return giftStr
    }
}

function questionsFilterMessage(logger, options) {

    options = parseQuestionsFilterMultipleOptions(options)


    let noOptions = (!options.units && !options.pages && !options.bank)
    let filtered = (options.units || options.pages)
    if (!noOptions) {
        process.stdout.write("Questions ")
        if (options.bank)
            process.stdout.write("in bank" + ((options.bank.length > 1) ? "s" : "") + " {" + options.bank.join(',') + "}")
        if (!filtered)
            console.log(" :")
    }
    if (filtered) process.stdout.write(((options.bank) ? "\n" : "") + "matching : q has")
    if (options.units) {
        process.stdout.write(" u ∈ {" + options.units.map(u => ("\"" + u + "\"").trim()).join(',') + "}")
    }
    if (options.pages) {
        if (options.unit) process.stdout.write(" ∩ ")
        process.stdout.write(" p ∈ {" + options.pages.join(',') + "}")
    }

    if (!noOptions && filtered) {
        console.log(" :")
        return true
    } else return false
}

function parseQuestionsFilterMultipleOptions(options) {
    if ("units" in options && !Array.isArray(options.unit)) {
        options.units = options.units.toString().split(',').map(u => {
            if (!isNaN(parseInt(u))) return "U" + u
            else return "U" + u.replace("U", '')
        })

    }
    if ("pages" in options && !Array.isArray(options.page)) {
        options.pages = options.pages.toString().replaceAll(',', ' ').replaceAll("p", '').trim().split(' ').map(str => 'p' + str)

    }
    if ("bank" in options && !Array.isArray(options.bank)) {
        options.bank = options.bank.toString().split(',')
    }
    return options
}

function qTypeToStr(qType) {
    switch (qType) {
        case qTypes.MULTI_CHOICE:
            return 'Multi-choice'

        case qTypes.DESCRIPTION:
            return 'Description'

        case qTypes.SHORT_ANSWER:
            return 'Short answer'

        case qTypes.TRUE_FALSE:
            return 'True / False'

        case qTypes.NUMERICAL:
            return 'Numerical'

        case qTypes.MATCHING:
            return 'Match pairs'
    }

}

/**
 * @param question
 * @param logger
 * @param options
 *  auto => true : Give the result with asking the answer (obligatory)
 *  answer => true: Give the score to the user (optional)
 *
 * @return number the score between 1 and 0
 *
 */
testQuestion = (question, logger, options) => {
    let bar = "-".repeat(Math.max(10, 10 - question.refs.id.toString().length));
    console.log(bar + "[ " + question.key + " : " + question.refs.id + " ]" + bar);

    // show the text
    console.log("\n" + question.text.toString().replace(/<[^>]*>?/gm, '') + "\n");

    // show the answer type
    let correctAnswersMap = [];
    let index = 0;
    const logFeedback = (feedback) => {
        if (feedback) {
            console.log(feedback)
        }
    }
    const getChoice = () => {
        let number
        let correct = false
        do {
            let input = prompt('');
            if (input)
                if (input.length > 0)
                    if (input.toUpperCase().charCodeAt(0) <= 'Z'.charCodeAt(0) && input.toUpperCase().charCodeAt(0) >= 'A'.charCodeAt(0)) {
                        input = input.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1
                    } else input = parseInt(input)
            number = input
            if (isNaN(number) || number < 1 || number > question.choices.length) {
                if (isNaN(number))
                    logger.error("Invalid format !")

                else
                    logger.error("Your choice does not exist !");
                correct = false
            } else {
                correct = true
            }
        } while (!correct)
        return number
    }
    switch (question.type) {
        case qTypes.MULTI_CHOICE:
            console.log("Answer with one of these propositions :");

            index = 0;
            correctAnswersMap = [];
            question.choices.forEach(choice => {
                index++;
                if (choice.isCorrect) {
                    correctAnswersMap.push(index);
                }
                console.log(index + " - " + choice.text);
            });
            console.log("---------")

            // We show the answers to the questions (auto-mode)
            if (options.auto) {
                logger.info("The expected answers are :");
                correctAnswersMap.forEach(value => {
                    let choice = question.choices[value - 1]
                    console.log(choice.text + ((choice.feedback) ? " (" + choice.feedback + ")" : ""));
                });
            } else {
                logger.info("What is the answer ? Type the number 1,2...");
                let number = getChoice()

                console.log("---------")
                if (correctAnswersMap.includes(number)) {
                    if (correctAnswersMap.length === 1) {
                        if (options.answer) {
                            logger.info("CORRECT !");
                            let choice = question.choices[number - 1]
                            console.log(choice.text + ((choice.feedback) ? " (" + choice.feedback + ")" : ""));
                        }
                        return 1;
                    } else {
                        if (options.answer) {
                            logger.info("PARTIALLY CORRECT !");
                            logger.info("The expected answers are :");
                            correctAnswersMap.forEach(value => {
                                let choice = question.choices[value - 1]
                                console.log(choice.text + ((choice.feedback) ? " (" + choice.feedback + ")" : ""));
                            });
                        }
                        return 0.5;
                    }
                } else {
                    if (options.answer) {
                        logger.error("NOT CORRECT !");
                        console.log("The expected answers were :");
                        correctAnswersMap.forEach(value => {
                            let choice = question.choices[value - 1]
                            console.log(choice.text + ((choice.feedback) ? " (" + choice.feedback + ")" : ""));
                        });
                    }
                    return 0;
                }
            }

            break;

        case qTypes.SHORT_ANSWER:
            console.log("Answer by a short answer");

            correctAnswersMap = [];
            question.choices.forEach(choice => {
                correctAnswersMap.push({text: choice.text, feedback: choice.feedback});
            });

            console.log("---------")

            // We show the answers to the questions (auto-mode)
            if (options.auto) {
                console.log("The expected answers were :");
                correctAnswersMap.forEach(value => {
                    console.log(value.text + ((value.feedback) ? " (" + value.feedback + ")" : ""));
                });

            } else {
                logger.info("What is the answer ?");
                let answer = prompt('');
                console.log("---------")
                if (correctAnswersMap.map(a => a.text).includes(answer.toLowerCase())) { //'includes' might be too insensitive for checking the right answer
                    if (options.answer) {
                        logger.info("CORRECT");
                        logFeedback(correctAnswersMap.find(a => a.text.includes(answer.toLowerCase())).feedback)

                    }
                    return 1;
                } else {
                    logger.error("NOT CORRECT")
                    if (options.answer) {
                        logger.info("The expected answers were :");
                        correctAnswersMap.forEach(value => {
                            console.log(value.text + ((value.feedback) ? " (" + value.feedback + ")" : ""));
                        });
                    }
                    return 0;
                }
            }
            break;

        case qTypes.TRUE_FALSE:
            console.log("Answer by true or false");
            console.log("---------")

            // We show the answers to the questions (auto-mode)
            if (options.auto) {
                logger.info("The expected answer is :");
                console.log(question.isTrue.toString());
            } else {
                logger.info("What is the answer ? true / false");
                let answer = prompt('').toLowerCase();
                while (answer !== "true" && answer !== "false") {
                    console.log("WRONG FORMAT ! Answer by : true OR false !");
                    answer = prompt('').toLowerCase();
                }

                console.log("---------")
                if ((answer === "false" && !question.isTrue) || answer === "true" && question.isTrue) {
                    if (options.answer) {
                        console.log("CORRECT ! ")
                        logFeedback(question.correctFeedback);
                    }
                    return 1;
                } else {
                    if (options.answer) {
                        console.log("NOT CORRECT ! ")
                        logFeedback(question.incorrectFeedback);
                    }
                    return 0;
                }
            }
            break;

        case qTypes.NUMERICAL:
            console.log("Answer with a number");
            console.log("---------")

            if (options.auto) {
                logger.info("The expected answer is :");
                question.choices.forEach(choice => {
                    if (choice.weight === null || choice.weight === 100) {
                        console.log(choice.number.toString());
                        logFeedback(choice.feedback);
                    }
                });
            } else {
                logger.info("What is the answer ? number");
                let answer = parseInt(prompt(''));
                while (isNaN(answer)) {
                    logger.info("What is the answer ? number");
                    answer = parseInt(prompt(''));
                }

                let around = false;
                let correct = false;
                let points = 0;
                let goodAnswer;
                logger.info("%s", JSON.stringify(question.choices, null, 2));
                let fb
                question.choices.forEach(choice => {
                    logger.info("%s", JSON.stringify(choice, null, 2));


                    if (choice.weight === null || choice.weight === 100) {
                        goodAnswer = choice.number;
                        if (choice.number === answer) {
                            correct = true;
                            fb = choice.feedback
                            points = 100;
                        }
                    } else {
                        if (answer >= (choice.number - choice.range) && answer <= (choice.number + choice.range)) {
                            if (choice.weight > points) {
                                around = true;
                                points = choice.weight;
                                fb = choice.feedback
                            }
                        }
                    }
                });

                console.log("---------")
                if (around || correct) {
                    if (correct) {
                        if (options.answer) {
                            logger.info("CORRECT !")
                            logFeedback(fb);
                        }
                        return 1;
                    } else {
                        if (options.answer) {
                            logger.info("PARTIALLY CORRECT => Score " + points / 100 + "/1");
                            logFeedback(fb);
                            logger.info("The expected answer was : " + goodAnswer);
                        }
                        return points / 100;
                    }
                } else {
                    if (options.answer) {
                        logger.error("NOT CORRECT !")
                        logFeedback(fb);
                        logger.info("The expected answer was : " + goodAnswer)
                    }
                    return 0;
                }
            }
            break;

        case qTypes.MATCHING:
            console.log("Matching the different proposals :");
            // We set the lists
            let subQuestions = [];
            let subAnswers = [];
            let subQuestionsNoShuffle = new Map();
            question.matchPairs.forEach(choice => {
                subQuestions.push(choice.subquestion);
                subAnswers.push(choice.subanswer);
                subQuestionsNoShuffle.set(choice.subquestion, choice.subanswer);
            });

            // We shuffle the lists
            shuffleArray(subQuestions);
            shuffleArray(subAnswers);

            //We print the questions and the answerz
            let i = 0;
            let abc = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
            subQuestions.forEach(sub => {
                i++;
                let space = " ".repeat(Math.max(5, 30 - (i.toString().length + 3 + sub.length)))
                console.log(i + " - " + sub + space + abc[i - 1] + " - " + subAnswers[i - 1]);
            });

            console.log("------------");

            // We show the answers to the questions (auto-mode)
            if (options.auto) {
                logger.info("The expected answer is :");
                question.matchPairs.forEach(choice => {
                    let space = " ".repeat(Math.max(5, 20 - (6 + choice.subquestion.length)))
                    let space2 = " ".repeat(Math.max(5, 20 - (choice.subquestion.length + space.length + 2)))
                    console.log(choice.subquestion + space + "->" + space2 + choice.subanswer);
                });
            } else {
                // Ask the answers
                logger.info("What are the answers ?");
                console.log("- To finish typing : ok");
                console.log("- To show answers typing : list");
                console.log("- To answer : <number>:<letter> (eg: 1:b)\n");
                let mapAnswers = new Map();
                let answer = prompt('').toLowerCase();
                while (answer.toLowerCase() !== "ok") {
                    if (answer === "list") {
                        console.log("\n----[ Your answers ]----")
                        mapAnswers.forEach((value, key) => {
                            let space = " ".repeat(Math.max(5, 20 - (key.toString().length + 3 + subQuestions[key - 1].length)))
                            let space2 = " ".repeat(Math.max(5, 30 - (subQuestions[key - 1].length + space.length + 2)))
                            console.log(key + " - " + subQuestions[key - 1] + space + "->" + space2 + value + " - " + subAnswers[abc.indexOf(value)]);
                        });
                    } else {
                        let number = parseInt(answer.split(":")[0]);
                        let letter = answer.split(":")[1];
                        if (!isNaN(number) && number >= 1 && number <= subQuestions.length && typeof letter !== "undefined" && abc.includes(letter.toLowerCase()) && abc.indexOf(letter.toLowerCase()) < subQuestions.length) {
                            mapAnswers.set(number, letter.toLowerCase());
                        } else {
                            logger.info("WRONG FORMAT ! To answer : <nummber>:<letter> (eg: 1:b)");
                        }
                    }
                    answer = prompt('').toLowerCase();
                    //console.log("\n" + (mapAnswers.size+1) +" === "+ subQuestionsNoShuffle.size);
                    if (answer === "ok" && mapAnswers.size !== subQuestionsNoShuffle.size) {
                        console.log("You did not answer all the questions !");
                        answer = "list";
                    }
                }

                let note = 0;
                console.log("")
                mapAnswers.forEach((value, key) => {
                    // We get the information about the scanner
                    let questionAnswer = subQuestions[key - 1];
                    let answerAnswer = subAnswers[abc.indexOf(value)];

                    // We get the real answer according to question
                    let subAnswerAnswer = subQuestionsNoShuffle.get(questionAnswer);

                    // We check if correct
                    if (answerAnswer === subAnswerAnswer) {
                        if (options.answer) {
                            console.log("[CORRECT] '" + questionAnswer + "' matches with '" + answerAnswer + "'");
                        }
                        note++;
                    } else {
                        //console.log(questionAnswer + " -> " + subAnswerAnswer)
                        if (options.answer) {
                            console.log("[NO] '" + questionAnswer + "' doesn't match with '" + answerAnswer + "'");
                        }
                    }
                });
                if (options.answer) {
                    //subQuestionsNoShuffle.size   -    note
                    // 1                           -    x
                    // x = note/subQuestionsNoShuffle.size (0....1)
                    logger.info("Your score : " + note / subQuestionsNoShuffle.size + " / 1");
                }
                return note / subQuestionsNoShuffle.size;
            }
            break;
    }
    return 1;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

module.exports = {
    Question: Question,
    qTypes: qTypes,
    conventions: conventions,
    Choice: Choice,
    classify: classify,
    makeQuestion: makeQuestion,
    makeTFQuestion: makeTFQuestion,
    jsonToQuestion: jsonToQuestion,
    questionsFilterMessage: questionsFilterMessage,
    parseQuestionsFilterMultipleOptions: parseQuestionsFilterMultipleOptions,
    qTypeToStr: qTypeToStr,
    testQuestion: testQuestion
}
