#!/usr/bin/node
const pegjs_parse = require('gift-pegjs').parse
const path = require('path')
const qst = require(path.join(__dirname, '/question.js'))
let key = 0

const parse = (gift_text) => {
    try {
        let questions = pegjs_parse(refactor(gift_text))
            .map(q => {
                switch (q.type) {
                    case qst.qTypes.NUMERICAL:

                        if (!Array.isArray(q.choices)) {
                            q.choices = [q.choices]
                        }
                        return qst.makeQuestion(q.title, q.type, q.stem.text,

                            q.choices.map(o => {
                                let feedback = o.feedback ? o.feedback.text : null;
                                let c = new qst.Choice(q.type, null, o.isCorrect, feedback, o.weight)
                                c.range = (q.choices.length !== 1) ? o.text.range : o.range
                                c.number = (q.choices.length !== 1) ? o.text.number : o.number
                                return c
                            }),

                            q.stem.format, key++ + 1)

                    case qst.qTypes.TRUE_FALSE:

                        let incorrectFeedback
                        if (q.incorrectFeedback)
                            incorrectFeedback = q.incorrectFeedback.text
                        let correctFeedback
                        if (q.incorrectFeedback)
                            correctFeedback = q.correctFeedback.text

                        return qst.makeTFQuestion(q.title, q.stem.text, q.stem.format, key++ + 1, q.isTrue, incorrectFeedback, correctFeedback)
                        break;

                    case qst.qTypes.MATCHING:
                        let output = qst.makeQuestion(q.title, q.type, q.stem.text, undefined, q.stem.format, key++ + 1)
                        if (q.matchPairs) {
                            output.matchPairs = q.matchPairs.map(mp => {
                                let obj = {}
                                obj.subquestion = mp.subquestion.text
                                obj.subanswer = mp.subanswer
                                return obj
                            })

                        }
                        return output
                        break;

                    default:
                        if (q.choices !== undefined) {

                            return qst.makeQuestion(q.title, q.type, q.stem.text, q.choices.map(o => {
                                let feedback
                                if (o.feedback)
                                    if (typeof o.feedback === 'string') feedback = o.feedback
                                    else feedback = o.feedback.text

                                return new qst.Choice(q.type, o.text.text, o.isCorrect, feedback, o.weight)
                            }), q.stem.format, key++ + 1)
                        } else {
                            return qst.makeQuestion(q.title, q.type, q.stem.text, q.choices, q.stem.format, key++ + 1)
                        }
                }
            })
        return questions
    } catch (e) {
        console.log("!--Parsing error--!")
        throw e
    }
}

String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}
//pb when having':' inside {}, like {=were so excited by =were so excited about#phrase: so ... that ...}
const replaceSingleColons = (str, char) => {
    let newStr = str
    let allowReplacement = true
    for (let i = 1; i < str.length - 1; i++) {
        if (str.charAt(i) === '{') allowReplacement = true
        else if (str.charAt(i) === '}') allowReplacement = false
        if (allowReplacement) {
            if (newStr.charAt(i) === ':') {
                if (!(newStr.charAt(i + 1) === ':' || newStr.charAt(i - 1) === ':')) {
                    // avoid replace : by - in question numerical (cf Romain)
                    if (isNaN(parseInt(newStr.charAt(i + 1)))) {
                        newStr = newStr.replaceAt(i, char)
                    }
                }
            }
        }
    }
    return newStr
}

const refactor = (gift_text) => {
    return replaceSingleColons(gift_text.replaceAll('~=', '=').replaceAll(/(\$.*)/g, " "), '-')
}

module.exports = {
    parse: parse
}
