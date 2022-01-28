#!/bin/node

const path = require('path')
const utils = require(path.join(__dirname, '/utils.js'))
const examsDir = path.join(__dirname, '../exams/')
const qstModule = require(path.join(__dirname, '/question.js'))
const loadedExamFile = utils.path.join(examsDir + ".loaded_exam")
const parser = require(path.join(__dirname, '/parser.js'))

if (!utils.fexists(loadedExamFile)) utils.fputs(loadedExamFile, "")


class Exam {
    name
    questions = []
    questionsNumber = 0

    constructor(eName, questions) {
        this.name = eName
        if (questions) {
            this.questions = questions
            this.questionsNumber = questions.length
        }
    }

    addQuestion = (q, callback, force) => {
        if (force || !this.questions.map(qst => qst.title).includes(q.title)) {

            this.questions[this.questionsNumber] = qstModule.jsonToQuestion(q) //two questions with the same title can't be added
            this.questions[this.questionsNumber].key = this.questionsNumber + 1
            this.questionsNumber++
            if (callback) callback(true)
        } else {
            if (callback)
                callback(false)
            else return false
        }
    }

    rmQuestion = (key, callback) => {
        let qToRm = this.questions.find(qst => qst.key === key)
        if (qToRm) {
            let index = this.questions.indexOf(qToRm)
            for (let i = index; i < this.questionsNumber - 1; i++) {
                if (this.questions[i + 1]) this.questions[i + 1].key--
                this.questions[i] = this.questions[i + 1]
            }
            this.questionsNumber--
            this.questions.pop()
        }

        if (callback) callback(qToRm)
    }

    swapQuestions = (key1, key2, callback) => {
        let qst1, qst2;
        if (this.questions) {
            qst1 = this.questions.find(qst => qst.key === key1)
            qst2 = this.questions.find(qst => qst.key === key2)
            if (qst1 && qst2) {
                let tmp = qst1.key
                qst1.key = qst2.key
                qst2.key = tmp
                let idx1 = this.questions.indexOf(qst1)
                let idx2 = this.questions.indexOf(qst2)
                this.questions[idx1] = qst2
                this.questions[idx2] = qst1
            }
        }
        callback(qst1, qst2)
    }

    load() {
        try {
            utils.serializeOne(utils.path.resolve(loadedExamFile), this)
            return true
        } catch (e) {
            return false
        }
    }

    saveGift(filePath) {
        try {
            utils.fputs(filePath, "")
            this.questions.forEach(q => {
                utils.fappends(filePath, q.toGift() + '\n')
            })
            return true
        } catch (e) {
            console.log(e)
            return false
        }
    }

    parseQuestions() {
        let gift_text = utils.fgets(utils.path.resolve(examsDir + this.name + ".gift"))
        if (gift_text) {
            this.questions = parser.parse(utils.fgets(utils.path.resolve(examsDir + this.name + ".gift")))
            this.questionsNumber += this.questions.length
        } else {
            this.questions = []
            this.questionsNumber = 0
        }
    }

    check(logger) {
        let valid
        let isDuplicated = false
        let hasRegulatoryQsNumber = true
        let duplicatedQs = this.questions
        duplicatedQs = duplicatedQs.reduce((acc, curr) => {
            let similarQs = duplicatedQs.filter(q => q.title === curr.title)
            if (similarQs.length > 1) {
                acc[curr.title] = similarQs.map(q => q.key)
            }
            duplicatedQs = duplicatedQs.filter(q => !similarQs.includes(q.key))
            return acc
        }, {})

        let nbDuplicated = Object.entries(duplicatedQs).length
        if (nbDuplicated > 0) {
            valid = false
            logger.info("!--Duplicated questions were found in '%s'--!\n", this.name)
            let removedCount = 0
            let off = 0
            Object.entries(duplicatedQs).forEach((entry) => {
                let keys = entry [1]
                let title = entry [0]
                console.log("\tQuestions " + keys.slice(0, keys.length - 1).join(', ') + " and " + keys[keys.length - 1] + " : " + title + " are duplicated !")

                if (utils.yesnoq("\tWould you like to delete the duplicatas ?")) {
                    keys.slice(1, keys.length).forEach(k => this.rmQuestion(k - off, function successDeleting(qst) {
                        logger.info(`\tCopy ${qst.key + off} has been removed.`)
                        off++
                    }))
                    removedCount++
                }
                console.log("")
            })
            if (removedCount > 0) {
                let giftPath = examsDir + this.name + ".gift"
                if (this.saveGift(giftPath)) {
                    logger.info("Your exam has been saved to : '%s'.", utils.path.resolve(giftPath))
                    this.load()
                } else
                    logger.error("An error occurred while trying to save the file to %s.", giftPath)
            }
            if (removedCount === nbDuplicated) {
                console.log("")
                valid = true
                logger.info("There are no more duplicated questions in exam '%s'.\n", this.name)
            } else {
                logger.info("'%s' still contains duplicated questions.--!\n", this.name)
                isDuplicated = true
            }

        } else {
            logger.info("There are no duplicated questions in exam '%s'.\n", this.name)
            valid = true
        }
        let questionsNumber = this.questionsNumber
        utils.ddl()
        console.log("")
        if (questionsNumber >= 15 && questionsNumber <= 20) {
            logger.info("'%s' does contain 15 ≤ %d ≤ 20 questions.\n", this.name, questionsNumber)
        } else {
            logger.info("!--'%s' contains 15 ≰ %d ≰ 20 question%s--!\n", this.name, questionsNumber,
                ((questionsNumber === 1) ? '' : 's'))
            hasRegulatoryQsNumber = false
            valid = false
        }
        utils.ddl()
        if (valid) {
            logger.info("'%s' is regulatory.", this.name)
            return true
        } else {
            logger.error(" Exam '%s' isn't regulatory,\n\tas it %s.", this.name,
                `has ${((isDuplicated) ? "duplicated questions" : "") + ((isDuplicated && !hasRegulatoryQsNumber) ? " and " : "")}` +
                `${(!hasRegulatoryQsNumber) ? ((questionsNumber > 20) ? "too many" : "not got enough") + " " + ((isDuplicated) ? "of those" : "questions") : ""}`)
            return false
        }
    }
}

getLoadedExam = () => {
    try {
        if (utils.fempty(loadedExamFile)) return null
        else {
            let exam = utils.unserializeOne(loadedExamFile)
            return new Exam(exam.name, exam.questions.map(q => qstModule.jsonToQuestion(q)))
        }
    } catch (e) {
        console.log(e)
        return null
    }
}
getAvailableExamsNames = () => {
    try {
        let loadedExam = getLoadedExam()
        let existingExams = utils.getExistingFilesBasenames(examsDir, ".gift")
        if (!loadedExam) return existingExams
        else return existingExams.filter(n => (loadedExam.name !== n))
    } catch (e) {
        console.log("Error : couldn't access the exams directory.")
    }
}

loadExam = (eName) => {
    try {
        let exam = new Exam(eName)
        exam.parseQuestions()
        exam.load()
        return exam
    } catch (e) {
        throw e
    }
}

unloadExam = () => {
    try {
        utils.fputs(loadedExamFile, "")
    } catch (e) {
        throw e
    }
}

examExists = (examName) => {
    return utils.fexists(utils.path.join(examsDir, examName + ".gift"))
}

buildExamFromName = (examName) => { //builds an Exam object but doesn't load it
    if (examExists(examName)) {
        return new Exam(examName, parser.parse(utils.fgets(utils.path.join(examsDir, examName + ".gift"))))
    } else {
        notExistsCallback()
        return null
    }
}

const loadExamByNameCommand = (args, logger, options) => {
    if (examExists(args.examName)) {
        let couldntLoadMsg = () => logger.error("Couldn't load exam '%s'.", args.examName)
        let loadedExam = getLoadedExam()

        if (loadedExam) {
            if (loadedExam.name === args.examName && (!options.duplicate || (options.duplicate && options.duplicate === loadedExam.name))) {
                logger.error("Exam '%s' is already loaded.", args.examName)
                return loadedExam
            } else {
                try {
                    loadedExam = loadExam(args.examName)
                    if (options && options.duplicate && loadedExam) {
                        if (examExists(options.duplicate)) {
                            logger.error("Cannot create the duplicata : an exam named '%s' already exists.", options.duplicate)
                        } else {
                            utils.cp(examsDir + loadedExam.name + ".gift", examsDir + utils.getBaseName(options.duplicate) + ".gift")
                            let duplicata = new Exam(options.duplicate, loadedExam.questions)
                            if (!options.silent) logger.info("Created a copy named '%s' of '%s'.", options.duplicate, loadedExam.name)
                            duplicata.load()
                            loadedExam = duplicata
                        }

                    }
                    if (!options.silent) logger.info("Loaded '" + loadedExam.name + "' successfully.")
                    return loadedExam
                } catch (e) {
                    console.log(e)
                    couldntLoadMsg()
                }
            }
        } else {
            try {
                loadedExam = loadExam(args.examName)
                if (options && options.duplicate && loadedExam) {
                    if (examExists(options.duplicate)) {
                        logger.error("Cannot create the duplicata : an exam named '%s' already exists.", options.duplicate)
                    } else {
                        utils.cp(examsDir + loadedExam.name + ".gift", examsDir + utils.getBaseName(options.duplicate) + ".gift")
                        let duplicata = new Exam(options.duplicate, loadedExam.questions)
                        if (!options.silent) logger.info("Created a copy named '%s' of '%s'.", options.duplicate, loadedExam.name)
                        duplicata.load()
                        loadedExam = duplicata
                    }

                }
                if (!options.silent) logger.info("Loaded '" + loadedExam.name + "' successfully.")
                return loadedExam
            } catch (e) {
                console.log(e)
                couldntLoadMsg()
            }
        }
    } else {
        logger.error("Exam '%s' doesn't exist.\nUse 'load exam <exam-path> -p' to permanently import a new exam from a '.gift' file.", args.examName)
    }

    return null
}

function selectQuestionsToAdd(exam, loadedQuestions, logger, options) {
    if (options.pages && !options.units) logger.error("'--pages (-p)' can only be used with --units (-u).")
    else {
        if (options.question) {
            if (options.units || options.allQuestions) logger.error("Incompatible options.")
            else {
                if (!Array.isArray(options.question)) {
                    options.question = options.question.toString().replaceAll(',', ' ').trim().split(' ').map(key => Number(key))
                }
                options.question.forEach(q => utils.acceptKey(q, logger))
                options.question = options.question.map(qKey => parseInt(qKey.toString()))
                return loadedQuestions.filter(q => options.question.includes(q.key))
            }
        } else {

            options = qstModule.parseQuestionsFilterMultipleOptions(options)
            loadedQuestions.forEach(q => {
                if (q.refs.pageNumber === undefined) q.refs.pageNumber = '??'
            })
            var questionsFilter = (q) => {
                let take = true
                if (options.units) {
                    take = (take && options.units.includes(q.refs.unit))
                    if (options.pages) {
                        take = (take && options.pages.includes('p' + q.refs.pageNumber))
                    }
                }
                return take
            }
            return loadedQuestions.filter(questionsFilter)
        }

    }
}

module.exports = {
    Exam: Exam,
    examsDir: examsDir,
    getLoadedExam: getLoadedExam,
    unloadExam: unloadExam,
    examExists: examExists,
    loadExam: loadExam,
    loadExamByNameCommand: loadExamByNameCommand,
    selectQuestionsToAdd: selectQuestionsToAdd,
    getAvailableExamsNames: getAvailableExamsNames,
    buildExamFromName: buildExamFromName
}