#!/usr/bin/node
const {program} = require('@caporal/core')
const path = require('path')

const libDir = path.join(__dirname, "lib/")

const utils = require(path.resolve(libDir + 'utils'))
const ddl = utils.ddl
const dddl = utils.dddl

const banksModule = require(path.resolve(libDir + "banks"))

const exmModule = require(path.resolve(libDir + "exam"))
const qst = require(path.resolve(libDir + "question"))
const vCard = require(path.resolve(libDir + "vCard"))
const prompt = require('prompt-sync')({
    sigint: true
})

const chartModule = require(path.resolve(libDir + 'chart'))

const {yesnoq} = utils.yesnoq


program
    .name("makeexam")
    .description("GIFT exams generator, by AubeSoft ®")
    .version("1.0.0")
    .disableGlobalOption("--verbose") //disables --verbose and -v

    //BANKS
    .command("", "------------------[BANKS]------------------")

    .command("list banks","Lists available banks")
    .alias("ls banks")
    .alias("ls b")
    .option("-l, --loaded","Lists loaded banks")
    .option("-u, --unloaded","Lists unloaded banks")
    .action( ({logger,options}) => {
        var logLoaded = () => {
            logger.info("Loaded banks :")
            ddl()
            if(banksModule.getLoadedBanks().length==0) noBankLoaded(logger)
            else banksModule.getLoadedBanks().forEach(b => console.log(b.getName()))
        }
        var logUnloaded = () => {
            logger.info("Available banks :")
            ddl()
            logEach(banksModule.getAvailableBanksNames())
        }
        if(options.loaded&&!options.unloaded)
            logLoaded()
        else if (options.unloaded&&!options.loaded)
            logUnloaded()
        else{
            logLoaded()
            logUnloaded()
        }
    })


    // Dresser le profil d'un exam avec une visualisation.
    .command("chart bank", "Shows an histogram of the questions' repartition")
    .alias("bank profile")
    .argument("[bank-name]", "Exam's name")
    .action(({logger, args}) => {
        let firstLoadedBanks = banksModule.getLoadedBanks()
        let selectedBank
        if (args.bankName) {
            if (banksModule.bankExists(args.bankName))
                selectedBank = new banksModule.Bank(args.bankName)
            else
                logger.error("Bank '%s' doesn't exist.", args.bankName)
        } else {
            if (firstLoadedBanks.length === 1) {
                selectedBank = firstLoadedBanks[0]
            } else if (firstLoadedBanks.length === 0) {
                logger.error("No bank is loaded.\nPlease specify a bank name.")
                process.exit(42)
            } else {
                logger.error("More than one bank are loaded.\nPlease specify a bank name.")
                process.exit(666)
            }
        }
        if (selectedBank) {
            let questions = Object.values(selectedBank.pages).reduce((acc, curr) =>
                    acc.concat(curr)
                , [])
            chartModule.make(questions, selectedBank.name, logger)
        } else {
            logger.error('Could not load any bank.')
        }
    })

    .command("load bank", "Loads a bank into the program")
    .argument("<bank>", "Bank names")
    .option("-p, --path", "Required if the provided arguments are paths")
    .action(({logger, args, options}) => {
        if (options.path && (path.extname(args.bank).toLowerCase() !== ".gift")) {
            logger.error("The specified path must be a '.gift' file.")
        } else if (options.path && !utils.fs.existsSync(path.resolve(args.bank.toString()))) {
            logger.error("File : '%s' could not be found.", args.bank)
        } else if (options.path) {
            if (banksModule.bankExists(utils.getBaseName(args.bank))) {
                logger.error("A bank named '%s' already exists in '%s'.\nYou can load it using 'load bank %s'.",
                    utils.getBaseName(args.bank), path.resolve(banksModule.banksDir), utils.getBaseName(args.bank))
            } else {
                if (banksModule.bankExists(utils.getBaseName(args.bank))) {
                    logger.error("Couldn't load bank '%s'.\n" +
                        "A bank named '%s' already exists in '%s'.\n",
                        utils.getBaseName(args.bank), utils.getBaseName(args.bank), path.resolve(banksModule.banksDir), utils.getBaseName(args.bank))
                } else {
                    banksModule.saveBank(path.resolve(args.bank))
                    if (new banksModule.Bank(path.basename(utils.getBaseName(args.bank))).load()) {
                        logger.info("Loaded bank '%s' successfully.", args.bank)
                    } else
                        logger.error("Couldn't load bank '%s'.", args.bank)
                }

            }
        } else {
            if (banksModule.bankExists(args.bank)) {
                if (!banksModule.getLoadedBanks().map(b => b.name).includes(args.bank)) {
                    if (new banksModule.Bank(args.bank).load()) {
                        logger.info("Loaded bank '%s' successfully.", args.bank)
                    } else {
                        logger.error("Couldn't load bank '%s'.", args.bank)
                    }
                } else {
                    logger.error("Bank '%s' is already loaded.", args.bank)
                }
            } else {
                logger.error("Bank '%s' doesn't exist.\nUse 'load bank <bank-path> -p' to permanently import a new bank from a '.gift' file.", args.bank)
            }

        }
    })

    .command("unload bank", "Unloads the specified bank(s) from the program")
    .alias("unload banks")
    .argument("[bank-names]", "Bank names")
    .option("-a,--all", "Unloads every loaded bank from the program")
    .action(({logger, args, options}) => {
        if (options.all) {
            banksModule.unloadAllBanks((fileState) => {
                if (fileState === utils.fileStates.EMPTY) {
                    noBankLoaded(logger)
                    return false
                } else if (fileState === utils.fileStates.RIGHT) {
                    logger.info("Unloaded all banks successfully.")
                }
            })
        } else {
            if (!args.bankNames) {
                logger.info("Usage : 'unload bank {bank1 [,bank2...] | --all }'.\nWithout the '--all' option, you have to specify bank names to unload.")
            } else {
                let bkNames = args.bankNames.toString().split(',')
                let toUnload = banksModule.getLoadedBanks().filter(b => bkNames.includes(b.name))
                toUnload.forEach(b => {
                    let bname = b.name
                    b.unload(success => {
                        if (success) logger.info("Bank '%s' was successfully unloaded.", bname)
                        else logger.error("Couldn't unload bank '%s'.", bname)
                    })
                })
                bkNames.forEach(n => {
                    if (!toUnload.map(b => b.name).includes(n)) logger.info("Bank '%s' isn't currently loaded.", n)
                })
            }
            //TODO (unload single bank)
        }

    })
    .command("unload all banks", "Unloads all loaded banks.")
    .action(() => {
        program.run(["unload bank", "-a"])
    })

    .command("reset", "Unloads every banks and exam from the program")
    .option("-args.bank, --banks", "Unloads banks")
    .option("-e, --exam", "Unloads the loaded exam")
    .action(() => {
        program.run(["unload bank", "-a"]).then(() => program.run(["unload exam"]))
    })

    //QUESTIONS
    .command("", "\n----------------[QUESTIONS]----------------")

    .command("list questions", "Lists all loaded questions.")
    .alias("ls questions", "show questions")
    .alias("ls q")
    .option("-r, --raw", "Simply lists every question's title. Default if only 1 bank is loaded.")
    .option("-c, --classified", "Classifies questions by unit and by page number. Default if more banks are loaded")
    .option("-u, --units <unit-names...>", "Restricts the units from which the questions come")
    .option("-p, --pages <page-numbers...>", "Restricts the page")
    .option("-f, --full-title", "Displays questions with their full title")
    .option("--no-type", "Doesn't display the question's type.")
    .option("-s, --search <title>", "Search question by name")
    .option("-t, --type <type>", "Restrict search question by type")
    .option("-d, --desc <value>", "Restrict search question by description")
    .option("-b, --bank <bank-names>", "Lists the questions of a bank of the given name instead of the loaded ones")
    .action(({logger, options}) => {
        if (banksModule.noneIsLoaded() && !options.bank) {
            noBankLoaded(logger)
        } else {
            options = qst.parseQuestionsFilterMultipleOptions(options)
            if (!qst.questionsFilterMessage(logger, options))
                logger.info("Loaded questions :")
            ddl()

            const questionsFilter = q => {
                let take = true
                if (options.units) {
                    take = (take && options.units.map(str => str.replace('-', ' ').trim()).includes(q.refs.unit))
                }
                if (options.pages) {
                    take = (take && options.pages.includes('p' + q.refs.pageNumber))
                }
                if (options.type) {
                    take = (take && qst.qTypeToStr(q.type)?.toLowerCase().includes(options.type.toLowerCase()))
                }
                if (options.search) {
                    if (options.desc) {
                        take = (take && q.text?.toLowerCase().includes(options.search.toLowerCase()))
                    }
                    if ((!options.desc && !options.type)) {
                        take = (take && q.refs.id.toLowerCase().includes(options.search.toLowerCase()))
                    }
                }
                return take
            }

            let allQuestions
            if (options.bank) {
                if (banksModule.bankExists(options.bank)) {
                    let b = new banksModule.Bank(options.bank)
                    allQuestions = b.getAllQuestions()
                } else {
                    logger.error("Bank '%s' doesn't exist.\nUse 'load bank <bank-path> -p' to permanently import a new bank from a '.gift' file.", options.bank)
                    process.exit()
                }
            } else {
                allQuestions = getAllQuestions()
            }
            displayQuestions(allQuestions.filter(questionsFilter), options)
            if (allQuestions.filter(questionsFilter).length === 0) {
                logger.info("No questions found")
            }
        }
    })



    /**
     * Allows you to answer a loaded question
     */
    .command("test question", "Lets you test a question\n")
    .alias("run question", "vizualize question")
    // .argument("<question-id>", "Question's TITLE")
    .argument("[key]", "Question's key (number displayed by command 'list questions') has priority over the title option")
    .option("-t, --title", "Question's key (number displayed by command 'list questions')")
    .option("-a, --auto", "Only displays the question, the choices and the answer")
    .action(({logger, args, options}) => {
        //check if the argument exist
        if (args.key || (options.title && typeof options.title == 'string')) {
            let questionsFiltred
            let allQuestions = getAllQuestions()
            // We find question
            if (args.key || !isNaN(args.key)) {
                utils.acceptKey(args.key, logger)
                if (allQuestions.length >= args.key && args.key >= 0) {
                    questionsFiltred = allQuestions.filter(q => q.key === args.key)
                    args.key = true
                } else {
                    logger.error("Question index out of range.\nUse 'list questions' to see the available questions.")
                    process.exit(-1)
                }
            } else questionsFiltred = allQuestions.filter(q => q.refs.id.toLowerCase() === options.title.toLowerCase())
            //check if the question exist
            if (questionsFiltred.length === 0 && !options.key) {
                logger.info("The question '" + options.title + "' cannot be found.")
                logger.info("To see all questions: makeexam.js list questions")

                // We propose questions according to its title argument
                let argsFilter = options.title.split(' ')
                let questionsList = allQuestions.filter(q => argsFilter.some(arg => q.refs.id.toLowerCase().includes(arg.toLowerCase())))

                // We check if we can propose questions according to its title argument
                if (questionsList.length >= 0) {
                    logger.info("Were you thinking of one of these question's TITLE?")
                    questionsList.forEach(q => {
                        displayQuestion(q, {fullTitle: false})
                    })
                }
            } else {
                // We get the first question of the list filtered
                let question = questionsFiltred[0]
                qst.testQuestion(question, logger, {auto: options.auto, answer: true})
            }
        } else {
            logger.error("Specify key argument or title option")
        }
    })

    //EXAMS
    .command("", "------------------[EXAMS]------------------")

    .command("", "\n-------Management")

    .command("new exam", "Creates and loads a new exam")
    .alias("create exam", "new", "create", "create new exam")
    .argument("<exam-name>", "Exam's name")
    .option("-q, --question <questions...>", "Adds questions to that new exam using their keys. Incompatible with -a, -u, -p")
    .option("-a, --all-questions", "Adds all the loaded questions to that new exam")
    .option("-u, --units <unit...>", "Selects all questions within these units")
    .option("-p, --pages <pages...>", "Restricts the questions by page numbers. Used only with --unit (-u).")
    .option("-o, --output <output-path>", "Saves the exam at the specified path") //todo test this option
    .action(({logger, args, options}) => {
        let exam = new exmModule.Exam(args.examName)
        if (exam.load()) {
            logger.info("Exam %s loaded successfully.\n", args.examName)
        } else {
            logger.info("Error : the exam could not be created.")
        }
        if (!options.allQuestions) {
            if (options.question || options.units || option.pages) {
                exmModule.selectQuestionsToAdd(exam, getAllQuestions(), logger, options).forEach(q => exam.addQuestion(q, (couldAdd) => {
                    if (couldAdd) logger.info(`Question ${q.key} : '${q.title}' was added to your exam.`)
                }, true))
            }

        } else {
            getAllQuestions().forEach(q => exam.addQuestion(q, (couldAdd) => {
                if (couldAdd) logger.info(`Question ${q.key} : '${q.title}' was added to your exam.`)
            }), true)
        }
        let giftPath = (options.output) ? utils.path.resolve(options.output) : utils.path.resolve(exmModule.examsDir + args.examName + ".gift")
        if (exam.saveGift(giftPath)) {
            logger.info("Your exam has been saved to : '%s'.", giftPath)
            exam.load()
        } else
            logger.error("An error occurred while trying to save the file to %s.", giftPath)
        if (exam.questions.length === 0)
            logger.info("It doesn't contain any question for now.")


    })

    .command("list exams", "Lists available exams")
    .alias("ls exams")
    .alias("ls e")
    .option("-l, --loaded", "Shows the name of the loaded exam.")
    .option("-u, --unloaded", "Lists the unloaded and available exams.")
    .action(({logger, options}) => {
        let loadedExam = exmModule.getLoadedExam()
        var logLoaded = () => {
            logger.info("Loaded exam :")
            ddl()
            if (!loadedExam) noExamLoaded(logger)
            else console.log(loadedExam.name)
        }
        var logUnloaded = () => {
            logger.info("Available exams :")
            ddl()
            logEach(exmModule.getAvailableExamsNames())
        }
        if (options.loaded && !options.unloaded && loadedExam) {
            logLoaded()
            if (utils.yesnoq("Would you like to see the questions available in '" + loadedExam.name + "'")) {
                program.run(["show", "exam", loadedExam.name])
            }
        } else if (options.unloaded && !options.loaded)
            logUnloaded()
        else {
            logLoaded()
            logUnloaded()
        }
    })

    .command("load exam", "Loads an exam into the program") //one exam is loaded at the time
    .argument("<exam-name>", "Exam's name")
    .option("-p, --path", "Permanently adds to the program the specified gift file as an exam and loads it", program.BOOLEAN)
    .option("-d, --duplicate <duplicatas-name>", "Loads a copy of the specified exam", program.BOOLEAN)
    .action(({logger, args, options}) => {
        if (options.path) {
            let baseName = utils.getBaseName(args.examName)
            if (path.extname(args.examName).toLowerCase() !== ".gift") {
                logger.error("The specified path must be a '.gift' file.")
            } else if (!utils.fs.existsSync(path.resolve(args.examName))) {
                logger.error("File : '%s' could not be found.", args.examName)
            } else if (options.path) {
                if (exmModule.examExists(baseName)) {
                    logger.info("An exam named '%s' already exists in '%s'.\nYou can load it using 'load exam %s'.",
                        baseName, path.resolve(exmModule.examsDir), baseName)
                } else {
                    try {
                        if (!utils.fempty(args.examName)) {
                            utils.cp(args.examName, exmModule.examsDir + baseName + ".gift")
                            let original = exmModule.loadExam(baseName)
                            if (options.duplicate && original) {
                                if (exmModule.examExists(options.duplicate)) {
                                    logger.error("Cannot create the duplicata : an exam named '%s' already exists.", options.duplicate)
                                } else {
                                    utils.cp(exmModule.examsDir + baseName + ".gift", exmModule.examsDir + utils.getBaseName(options.duplicate) + ".gift")
                                    let duplicata = new exmModule.Exam(options.duplicate, original.questions)
                                    duplicata.load()
                                    logger.info("Created a copy named '%s' of '%s'.", options.duplicate, baseName)
                                    baseName = duplicata.name
                                }

                            }
                            logger.info("Loaded exam '" + baseName + "' successfully.")
                        } else {
                            logger.error("Couldn't load exam '%s', as it is empty.", args.examName)
                        }
                    } catch (e) {
                        console.log(e)
                        logger.error("Couldn't load exam '%s'.", args.examName)
                    }

                }
            }
        } else {
            options.silent = true
            exmModule.loadExamByNameCommand(args, logger, options)
        }
    })

    .command("unload exam", "Unloads the loaded exam from the program") //one exam is loaded at the time
    .action(({logger}) => {
        let exam = exmModule.getLoadedExam()
        if (exam) {
            let name = exam.name
            try {
                exmModule.unloadExam()
                logger.info("Unloaded exam '%s' successfully", name)
            } catch (e) {
                console.log(e)
            }
        } else {
            noExamLoaded(logger)
        }
    })


    .command("remove exam", "Unloads and removes permanently an exam.")
    .alias("rm exam")
    .argument("[exam-name]", "Exam's name")
    .action(({logger, args}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name === args.examName) {
                selectedExam = firstLoadedExam
            } else {
                let options = {silent: true}
                selectedExam = exmModule.loadExamByNameCommand(args, logger, options)
            }
        }
        if (selectedExam) {
            if (utils.yesnoq("Are you sure you want to remove " + selectedExam.name + " permanently")) {
                try {
                    exmModule.unloadExam()
                    utils.rm(utils.path.resolve(exmModule.examsDir + selectedExam.name + ".gift"))
                    logger.info("'%s' has been removed successfully.", selectedExam.name)
                    if (firstLoadedExam) firstLoadedExam.load()
                } catch (e) {
                    logger.error("Could not remove '%s'.", selectedExam.name)
                }

            }
        } else {
            noExamLoaded(logger)
        }

    })


    .command("export exam", "Exports an exam as a .gift file.\n")
    .argument("[path]", "Path of the exported gift file.")
    .argument("[exam-name]", "Name of the exam to export. If left blank, the loaded exam is used instead.")
    .action(({logger, args}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name === args.examName) {
                selectedExam = firstLoadedExam
            } else {
                let options = {silent: true}
                selectedExam = exmModule.loadExamByNameCommand(args, logger, options)
            }
        }

        if (!selectedExam) {
            noExamLoaded(logger)
        } else {
            if (selectedExam.questions.length === 0)
                logger.info("Exam '%s' doesn't contain any questions for now.", selectedExam.name)
        }
        let giftPath
        if (args.path) giftPath = utils.path.resolve(args.path)
        else giftPath = utils.path.resolve('./')
        if (utils.fs.lstatSync(giftPath).isDirectory()) giftPath += "/" + selectedExam.name + "_exported"
        if (path.extname(giftPath).toLowerCase() !== ".gift") giftPath += ".gift"
        if (!utils.fexists(giftPath) || yesnoq(giftPath + " already exists. Overwrite ?")) {
            if (selectedExam.saveGift(giftPath)) {
                logger.info("Your exam has been saved to : '%s'.", giftPath)
            } else
                logger.error("An error occurred while trying to save the file to %s.", giftPath)
        } else logger.info("Exam '%s' wasn't exported", selectedExam.name)


        if (selectedExam !== firstLoadedExam) firstLoadedExam.load()

    })


    .command("", "\n-------Edition")

    .command("edit exam add", "Edits an existing exam, adding questions to it.")
    .argument("[exam-name]", "Exam's name")

    .option("-q, --question <questions...>", "Adds questions to that new exam using their keys. Incompatible with -a, -u, -p")
    .option("-a, --all-questions", "Adds all the loaded questions to that new exam")
    .option("-u, --units <unit...>", "Selects all questions within these units")
    .option("-p, --pages <pages...>", "Restricts the questions by page numbers. Used only with --unit (-u).")

    .option("-o, --output <output-path>", "Saves the gift at the specified path. It won't be stored by the program for further usage.") //todo test this option
    .option("-d, --duplicata <duplicatas-name>", "Edits and loads an independant copy with the speficied name.")

    .action(({logger, args, options}) => {
        let loadedExam = exmModule.getLoadedExam()
        let selectedExam = loadedExam
        if (args.examName) {
            if (loadedExam.name === args.examName) {
                selectedExam = loadedExam
            } else {
                options.silent = true
                selectedExam = exmModule.loadExamByNameCommand(args, logger, options)
            }
        }
        if (selectedExam) {
            if (options.duplicata) {
                if (!exmModule.examExists(options.duplicata)) {
                    selectedExam = new exmModule.Exam(options.duplicata, selectedExam.questions)
                    logger.info("Exam '%s' created and loaded.", options.duplicata)
                } else {
                    logger.error("Unable to create the duplicata : an exam named '%s' already exists at '%s'."
                        , options.duplicata, path.resolve(exmModule.examsDir))
                    process.exit(1)
                }
            }
            if (options.question) {
                let addedIndexes = options.question.toString().replaceAll(',', ' ').trim().split(' ').map(k => parseInt(k))
                if (addedIndexes.filter(i => !isNaN(i)).length > 0 && !(options.questions || options.pages || options.units)) {
                    options.question = addedIndexes
                }
            }

            let wantedQuestions = exmModule.selectQuestionsToAdd(selectedExam, getAllQuestions(), logger, options)
            if (wantedQuestions) {

                wantedQuestions.forEach(q => selectedExam.addQuestion(q, (couldAdd) => {
                    if (!couldAdd) {
                        logger.info(`Question '${q.title}' is already present in this exam.`)
                        if (utils.yesnoq("Do you want to add it anyway ?")) selectedExam.addQuestion(q, null, true)
                    } else {
                        logger.info(`Question ${q.key} : '${q.title}' was added to your exam.`)
                    }

                }))
                let giftPath = (options.output) ? utils.path.resolve(options.output) : utils.path.resolve(exmModule.examsDir + selectedExam.name + ".gift")
                if (!wantedQuestions.length > 0) {
                    logger.info("No questions selected. The exam remains unchanged.")
                }
                if (selectedExam.questions.length > 0) {
                    if (selectedExam.saveGift(giftPath)) {
                        logger.info("Your exam has been saved to : '%s'.", giftPath)
                        selectedExam.load()
                    } else
                        logger.error("An error occurred while trying to save the file to %s.", giftPath)
                }
            }
        } else {
            console.log("No exam could be loaded.")
        }

    })

    .command("edit exam remove", "Removes questions identified by their keys from an exam.")
    .alias("edit exam remove", "edit exam delete")
    .alias("edit exam rm")
    .option("-q, --question <questions...>", "Specify after this option the indexes of the questions you want to remove from the exam.")
    .argument("[exam-name]", "Exam's name")
    .option("-o, --output <output-path>", "Saves the gift at the specified path. It won't be stored by the program for further usage.") //todo test this option
    .option("-d, --duplicata <duplicatas-name>", "Edits and loads an independant copy with the speficied name.")
    .action(({logger, args, options}) => {
        let loadedExam = exmModule.getLoadedExam()
        let selectedExam = loadedExam
        if (args.examName) {
            let removedIndexes = args.examName.toString().replaceAll(',', ' ').trim().split(' ').map(k => parseInt(k))
            if (removedIndexes.filter(i => !isNaN(i)).length > 0 && !options.question) {
                options.question = removedIndexes
            } else if (loadedExam.name === args.examName) {
                selectedExam = loadedExam
            } else {
                options.silent = true
                selectedExam = exmModule.loadExamByNameCommand(args, logger, options)
            }
        }
        if (selectedExam) {
            if (options.duplicata) {
                if (!exmModule.examExists(options.duplicata)) {
                    selectedExam = new exmModule.Exam(utils.getBaseName(options.duplicata), selectedExam.questions)
                    logger.info("Exam '%s' created and loaded.", options.duplicata)
                } else {
                    logger.error("Unable to create the duplicata : an exam named '%s' already exists at '%s'."
                        , options.duplicata, path.resolve(exmModule.examsDir))
                    process.exit(1)
                }
            }
            if (!Array.isArray(options.question)) {
                options.question = options.question.toString().replaceAll(',', ' ').trim().split(' ').map(k => Number(k))
            }
            if (options.question) {
                let off = 0
                let removedCount = 0
                options.question.forEach(k => {
                    utils.acceptKey(k, logger)
                    selectedExam.rmQuestion(k - off, function successDeleting(qst) {
                    if (qst) {
                        logger.info(`Question ${qst.key + off} : '${qst.title}' has been removed.`)
                        removedCount++
                        off++
                    } else {
                        logger.error(`Question ${k} not found in ${selectedExam.name}.`)
                    }
                })})
                let giftPath = (options.output) ? utils.path.resolve(options.output) : utils.path.resolve(exmModule.examsDir + selectedExam.name + ".gift")
                if (removedCount === 0) {
                    logger.info("No questions selected. The exam remains unchanged.")
                } else {
                    console.log("")
                    if (removedCount === 1)
                        logger.info("1 question has been removed.\n")
                    else
                        logger.info("%d questions have been removed.\n", removedCount)
                }
                if (selectedExam.saveGift(giftPath)) {
                    logger.info("Your exam has been saved to : '%s'.", giftPath)
                    selectedExam.load()
                } else
                    logger.error("An error occurred while trying to save the file to %s.", giftPath)
            }
        } else {
            console.log("No exam could be loaded.")
        }

    })

    .command("edit exam swap", "Swap two questions within an exam.")
    .alias("edit exam permute", "edit exam exchange")
    .option("-q, --questions <questions...>", "Implicit. Specify after this option the indexes of the questions to swap using the syntax 'index1,index2'")
    .argument("[exam-name]", "Exam's name")
    .option("-o, --output <output-path>", "Saves the gift at the specified path. It won't be stored by the program for further usage.") //todo test this option
    .option("-d, --duplicata <duplicatas-name>", "Edits and loads an independant copy with the speficied name.")
    .action(({logger, args, options}) => {
        let loadedExam = exmModule.getLoadedExam()
        let selectedExam = loadedExam
        if (args.examName) {
            let swappedIndexes = args.examName.toString().replaceAll(',', ' ').trim().split(' ').map(k => parseInt(k))
            if (swappedIndexes.filter(i => !isNaN(i)).length === 2 && !options.questions) {
                options.questions = swappedIndexes
            } else if (loadedExam.name === args.examName) {
                selectedExam = loadedExam
            } else {
                options.silent = true
                selectedExam = exmModule.loadExamByNameCommand(args, logger, options)
            }
        }
        if (selectedExam) {
            if (options.duplicata) {
                if (!exmModule.examExists(options.duplicata)) {
                    selectedExam = new exmModule.Exam(utils.getBaseName(options.duplicata), selectedExam.questions)
                    logger.info("Exam '%s' created and loaded.", options.duplicata)
                } else {
                    logger.error("Unable to create the duplicata : an exam named '%s' already exists at '%s'."
                        , options.duplicata, path.resolve(exmModule.examsDir))
                    process.exit(1)
                }
            }
            if (!Array.isArray(options.questions)) {
                options.questions = options.questions.toString().replaceAll(',', ' ').trim().split(' ').map(k => Number(k))
            }
            if (options.questions) {
                if (options.questions.length === 2) {
                    options.questions.forEach(k => utils.acceptKey(k, logger))
                    let idx1 = options.questions[0]
                    let idx2 = options.questions[1]
                    let successSwapping = false
                    if (idx1 === idx2) {
                        logger.info("You have selected the same index twice. Exam '%s' remains unchanged.", selectedExam.name)
                    } else {
                        selectedExam.swapQuestions(idx1, idx2, function notifySwap(qst1, qst2) {
                            if (qst1 && qst2) {
                                logger.info(`Questions :\n\t${idx1} -> ${qst1.key} : '${qst1.title}'
                                    \n\t\tand :
                                \n\t${idx2} -> ${qst2.key} : '${qst2.title}' were swapped.`)
                                successSwapping = true
                            } else {
                                let bothAreNull = (!qst1 && !qst2)
                                logger.error(`Could not find ${(bothAreNull) ? "both " : ""}question${(bothAreNull) ? "s" : ""}`
                                    + `${(!qst1) ? idx1 + " " : ""}${(bothAreNull) ? "and " : ""} ${(!qst2) ? idx2 + " " : ""}.`)
                            }

                        })
                        if (successSwapping) {
                            let giftPath = (options.output) ? utils.path.resolve(options.output) : utils.path.resolve(exmModule.examsDir + selectedExam.name + ".gift")

                            if (selectedExam.saveGift(giftPath)) {
                                logger.info("Your exam has been saved to : '%s'.", giftPath)
                                selectedExam.load()
                            } else
                                logger.error("An error occurred while trying to save the file to %s.", giftPath)
                        }

                    }

                } else {
                    logger.error("You must select exactly two questions using the syntax 'index1,index2'.")
                }
            }
        } else {
            console.log("No exam could be loaded.")
        }

    })

    .command("edit exam", "Interactive menu for editing exams")
    .argument("[exam-name]", "Exam's name")
    .action(({logger, args}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name === args.examName) {
                selectedExam = firstLoadedExam
            } else {
                let options = {silent: true}
                selectedExam = exmModule.loadExamByNameCommand(args, logger, options)
            }
        }
        let changes = 0
        if (!selectedExam) {
            noExamLoaded(logger)
        } else {
            let loadedQuestions = getAllQuestions()

            function menu() {
                console.log()
                console.log("EDITING " + selectedExam.name.toUpperCase())
                ddl()
                console.log("\t+ 1 - List the available questions")
                console.log("\t+ 2 - List the questions in this exam")
                console.log("\t+ 3 - Add a question")
                console.log("\t+ 4 - Remove a question")
                console.log("\t+ 5 - Swap two questions")
                console.log("\t+ 6 - Check exam validity")
                console.log("\t+ 7 - Work on a copy")
                console.log("\t+ 8 - Export as a gift file")
                console.log("\t+ 9 - Save & exit")
                console.log("\t+ 0 - Exit without saving")
                console.log("")
                let options = {}
                switch (utils.getint("Select an operation")) {
                    case 1:
                        console.log()
                        if (loadedQuestions.length <= 0) {
                            logger.info("No questions loaded in the program.\n\tUse 'load bank <bank-name>' before editing to import a bank's questions.")
                        } else {
                            logger.info("Available questions :")
                            ddl()
                            displayQuestions(loadedQuestions, {})
                        }
                        return true

                    case 2:
                        console.log()
                        if (selectedExam.questions.length <= 0) logger.info("\tThis exam contains yet no questions.")
                        else {
                            logger.info("Questions in exam %s :", selectedExam.name)
                            ddl()
                            displayQuestions(selectedExam.questions, {raw: true})
                        }
                        return true

                    case 3:
                        console.log()
                        let addedIndexes = utils.prompt("Select questions to add :").toString().replaceAll(',', ' ').trim().split(' ').map(k => parseInt(k))
                        if (addedIndexes.filter(i => !isNaN(i)).length > 0 && !(options.questions || options.pages || options.units)) {
                            options.question = addedIndexes
                        }
                        let wantedQuestions = exmModule.selectQuestionsToAdd(selectedExam, loadedQuestions, logger, options)
                        console.log(loadedQuestions)
                        if (wantedQuestions) {
                            console.log()
                            ddl()
                            wantedQuestions.forEach(q => selectedExam.addQuestion(q, (couldAdd) => {
                                if (!couldAdd) {
                                    logger.info(`Question '${q.title}' is already present in this exam.`)
                                    if (utils.yesnoq("Do you want to add it anyway ?")) {
                                        selectedExam.addQuestion(q, null, true)
                                        changes++
                                    }
                                } else {
                                    logger.info(`Question ${q.key} : '${q.title}' was added to your exam.`)
                                    changes++
                                }
                            }))
                            ddl()
                        } else {
                            logger.info("Your selection contains no questions.")
                        }
                        return true

                    case 4:
                        console.log()
                        options.question = utils.prompt("Select questions to remove :").toString().replaceAll(',', ' ').trim().split(' ').map(k => parseInt(k))
                        ddl()
                        let off = 0
                        let removedCount = 0
                        options.question.forEach(k => selectedExam.rmQuestion(k - off, function successDeleting(qst) {
                            if (qst) {
                                logger.info(`Question ${qst.key + off} : '${qst.title}' has been removed.`)
                                removedCount++
                                off++
                                changes++
                            } else {
                                logger.error(`Question ${k} not found in ${selectedExam.name}.`)
                            }

                        }))
                        if (removedCount === 0) {
                            logger.info("No questions selected. The exam remains unchanged.")
                        }
                        return true

                    case 5:
                        let swappedIndexes = utils.prompt("Select two questions q1,q2 to swap :").toString().replaceAll(',', ' ').trim().split(' ').map(k => parseInt(k))
                        if (swappedIndexes.filter(i => !isNaN(i)).length === 2 && !options.questions) {
                            options.questions = swappedIndexes
                        }
                        let idx1 = options.questions[0]
                        let idx2 = options.questions[1]
                        if (idx1 === idx2) {
                            logger.info("You have selected the same index twice. Exam '%s' remains unchanged.", selectedExam.name)
                        } else {
                            selectedExam.swapQuestions(idx1, idx2, function notifySwap(qst1, qst2) {
                                if (qst1 && qst2) {
                                    logger.info(`Questions :\n\t${idx1} -> ${qst1.key} : '${qst1.title}'
                                                \n\t\tand :
                                            \n\t${idx2} -> ${qst2.key} : '${qst2.title}' were swapped.`)
                                    successSwapping = true
                                    changes++
                                } else {
                                    let bothAreNull = (!qst1 && !qst2)
                                    logger.error(`Could not find ${(bothAreNull) ? "both " : ""}question${(bothAreNull) ? "s" : ""}`
                                        + `${(!qst1) ? idx1 + " " : ""}${(bothAreNull) ? "and " : ""} ${(!qst2) ? idx2 + " " : ""}.`)
                                }

                            })

                        }
                        return true

                    case 6:
                        console.log()
                        selectedExam.check(logger)
                        return true

                    case 7:
                        console.log()
                        let duplicatasName = utils.prompt("Type in the name of the duplicata you want to create :")
                        if (exmModule.examExists(duplicatasName)) {
                            logger.error("Cannot create the duplicata : an exam named '%s' already exists.", duplicatasName)
                        } else {
                            utils.cp(exmModule.examsDir + selectedExam.name + ".gift", exmModule.examsDir + utils.getBaseName(duplicatasName) + ".gift")
                            let duplicata = new exmModule.Exam(duplicatasName, selectedExam.questions)
                            duplicata.load()
                            logger.info("Created a copy named '%s' of '%s'.", duplicatasName, selectedExam.name)
                            logger.info("Loaded exam '%s' successfully.", duplicatasName)
                            selectedExam = duplicata
                        }
                        return true

                    case 8:
                        console.log("Will be saved as : '" + exmModule.examsDir + selectedExam.name + "'.gift .")
                        let savePath
                        let defaultPath
                        if (utils.yesnoq("Would you like to set a custom saving location instead ?")) {
                            console.log()
                            savePath = utils.path.resolve(utils.prompt("Enter the desired path for your output file :") + ".gift")
                            defaultPath = false
                        } else {
                            savePath = utils.path.resolve(exmModule.examsDir + selectedExam.name + ".gift")
                            defaultPath = true
                        }
                        try {
                            selectedExam.questions.forEach(q => console.log(q.toGift()))
                            if (!defaultPath && utils.fexists(savePath)) {
                                console.log()
                                console.log(savePath + " already exists.")
                                if (utils.yesnoq("Would you like to overwrite it ?")) {
                                    selectedExam.saveGift(savePath)
                                    logger.info("Your exam has been saved to : '%s'.", savePath)
                                    selectedExam.load()
                                }
                            } else {
                                console.log(savePath)
                                selectedExam.saveGift(savePath)
                                logger.info("Your exam has been saved to : '%s'.", savePath)
                                selectedExam.load()
                            }

                        } catch (e) {
                            if (savePath) logger.error("Couldn't save the exam as '%s'.", savePath)
                        }
                        return false

                    case 9:
                        console.log()
                        if (changes) logger.info(changes + " modification" + ((changes !== 1) ? 's' : '') + " saved successfully.")
                        else logger.info("You have not modified anything.")
                        selectedExam.load()
                        return false

                    case 0 || 10:
                        return false
                }

            }

            let replayMenu
            while (replayMenu = menu()) ;
        }

    })

    .command("", "\n-------Consultation")
    .command("show exam", "Shows the questions of an exam with their keys.")
    .alias("edit exam show questions")
    .alias("edit exam show")
    .alias("edit exam list questions")
    .alias("edit exam ls questions")
    .alias("edit exam ls")
    .alias("edit exam list")
    .argument("[exam-name]", "Exam's name")

    .option("-i, --information", "Allow to add option")
    .option("-r, --raw", "Simply lists every question's title. Enabled by default.", program.BOOLEAN, true)
    .option("-c, --classified", "Classifies questions by unit and by page number.")

    .option("-q, --question <questions...>", "Selects specific questions")
    .option("-u, --units <unit...>", "Selects all questions within these units")
    .option("-p, --pages <pages...>", "Restricts the questions by page numbers. Used only with --unit (-u).")

    .option("-n, --number", "Displays the total number of questions in that exam.")

    .action(({logger, args, options}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name !== args.examName) {
                selectedExam = exmModule.loadExam(args.examName)
            }
        }
        if (selectedExam) {
            if (!options.classified) options.raw = true
            let wantedQuestions = exmModule.selectQuestionsToAdd(selectedExam, selectedExam.questions, logger, options)
            if (!((options.pages && !options.units) || (options.units && options.question))) {
                if (selectedExam.questionsNumber === 0) {
                    logger.info("'%s' contains yet no question.\nYou can add questions using 'edit exam add <questions...>'", selectedExam.name)
                } else {
                    logger.info("Questions in exam '%s' :", selectedExam.name)
                    qst.questionsFilterMessage(logger, options)
                    ddl()
                    displayQuestions(wantedQuestions, options)
                    if (options.number) {
                        console.log("")
                        logger.info("'%s' contains a total of %d question%s", selectedExam.name, selectedExam.questionsNumber,
                            ((selectedExam.questionsNumber === 1) ? '' : 's'))
                    }
                }
                if (args.examName)
                    if (firstLoadedExam.name !== args.examName)
                        firstLoadedExam.load()
            }
        } else {
            noExamLoaded(logger)
        }

    })

    .command("take exam", "Lets you simulate the taking of an exam.")
    .alias("run exam", "vizualize exam", "test exam")
    .argument("[exam-name]", "Exam's name")
    .option("-a, --auto", "Gives the answers automatically")
    .action(({logger, args, options}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name !== args.examName) {
                selectedExam = exmModule.loadExam(args.examName)
            }
        }
        if (selectedExam) {
            logger.info("Taking exam '%s' :", selectedExam.name)
            ddl()
            answer = (options.auto) ? true : utils.yesnoq("Do you wish to display the answers ?")
            console.log(answer)
            let points = 0
            selectedExam.questions.forEach(question => {
                console.log("\n\n")
                points += qst.testQuestion(question, logger, {auto: (options.auto), answer: answer})
            })
            console.log("\n\n")
            ddl()
            logger.info("[EXAM] Your score : " + points + " / " + selectedExam.questions.length)
            if (args.examName)
                if (firstLoadedExam.name !== args.examName)
                    firstLoadedExam.load()
        } else {
            noExamLoaded(logger)
        }
    })

    .command("check exam", "Checks the conformity of an exam.")
    .alias("verify exam")
    .argument("[exam-name]", "Exam's name")
    .action(({logger, args}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name !== args.examName) {
                selectedExam = exmModule.loadExam(args.examName)
            }
        }
        if (selectedExam) {
            logger.info("Checking if '%s' is regulatory\n", selectedExam.name)
            ddl()
            console.log("")
            selectedExam.check(logger)
        } else {
            noExamLoaded(logger)
        }

    })


    // Dresser le profil d'un exam avec une visualisation.
    .command("chart exam", "Shows an histogram of the questions ' repartition")
    .alias("exam profile")
    .argument("[exam-name]", "Exam's name")
    .action(({logger, args}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name !== args.examName) {
                selectedExam = exmModule.loadExam(args.examName)
            }
        }
        if (selectedExam) {
            chartModule.make(selectedExam.questions, selectedExam.name, logger)
        } else {
            noExamLoaded(logger)
        }

    })
    // CompareComparer le profil de deux examx
    .command("compare exams", "Compares the profile of two exams\n")
    .alias("compare exam")
    .argument("<exam1-name>", "Exam 1's name.")
    .argument("[exam2-name]", "Exam 2's name.Default : the loaded exam's.")
    .action(({logger, args}) => {

        let exam1
        let exam2
        if (!args.exam2Name) {
            exam2 = getLoadedExam()
            if (!exam2) {
                logger.error("No exam loaded. Load one using 'load exam' or specify an existing exam's name.")
                process.exit(-1)
            }
        } else {
            exam2 = exmModule.buildExamFromName(args.exam1Name, () => {
                logger.error("Exam 2 : '%s' couldn't be found.", args.exam2Name)
                process.exit(-1)
            })
        }

        let secondName
        if (args.exam2Name) secondName = args.exam2Name
        else secondName = args.exam1Name

        exam1 = exmModule.buildExamFromName(secondName, () => {
            logger.error("Exam 1 : '%s' couldn't be found.", secondName)
            process.exit(-1)
        })

        if (exam1 && exam2) {
            const makeTitleQDict = (dict, q) => {
                if (!dict[q.title]) {
                    dict[q.title] = q
                } else if (!Array.isArray(dict[q.title])) {
                    dict[q.title] = [dict[q.title], q]
                }
                return dict
            }
            titleq1dict = exam1.questions.reduce(makeTitleQDict, {})
            titleq2dict = exam2.questions.reduce(makeTitleQDict, {})
            let exam1OnlyQ = []
            let exam2OnlyQ = []
            let commonQ = []
            Object.entries(titleq1dict).forEach((e) => {
                let ttl = e[0]
                let qsts = e[1]
                if (titleq2dict[ttl]) {
                    let qsts2 = titleq2dict[ttl]
                    if (Array.isArray(qsts)) {
                        if (Array.isArray(qsts2)) {
                            if (qsts2.length > qsts.length) {
                                for (let i = 0; i < qsts2.length - qsts.length; i++) {
                                    exam2OnlyQ.push(qsts2[i])
                                }
                                commonQ = commonQ.concat(qsts)
                            } else if (qsts.length > qsts2.length) {
                                for (let i = 0; i < qsts.length - qsts2.length; i++) {
                                    exam1OnlyQ.push(qsts[i])
                                }
                                commonQ = commonQ.concat(qsts.slice(0, qsts2.length))
                            } else {
                                commonQ = commonQ.concat(qsts)
                            }
                        } else {
                            commonQ = commonQ.concat(qsts[0])
                            if (qsts.length > 1) {
                                for (let i = 1; i < qsts.length; i++) {
                                    exam1OnlyQ.push(qsts[i])
                                }
                            }
                        }
                    } else {
                        commonQ.push(qsts)
                        if (Array.isArray(qsts2)) {
                            if (qsts2.length > 1) {
                                for (let i = 1; i < qsts2.length; i++) {
                                    exam2OnlyQ.push(qsts2[i])
                                }
                            }
                        }
                    }
                } else {
                    if (Array.isArray(qsts)) {
                        exam1OnlyQ = exam1OnlyQ.concat(qsts)
                    } else {
                        exam1OnlyQ.push(qsts)
                    }
                }
            })
            Object.entries(titleq2dict).forEach((e) => {
                let ttl = e[0]
                let qsts = e[1]
                if (!exam1.questions.map(q => q.title).includes(ttl)) {
                    if (Array.isArray(qsts)) {
                        exam2OnlyQ = exam2OnlyQ.concat(qsts)
                    } else {
                        exam2OnlyQ.push(qsts)
                    }
                }
            })

            let sim = commonQ.length * 100 / exam1.questions.length
            logger.info(sim.toFixed(1) + "\% of exam 1 ('%s')'s questions are also in exam 2 ('%s').", exam1.name, exam2.name)
            ddl()
            const logQ = (q) => {
                let tabbedQTitle = '\t' + q.title
                console.log(tabbedQTitle + " " + "-".repeat(Math.max(3, 45 - tabbedQTitle.length)) + " " + qst.qTypeToStr(q.type))
            }
            if (commonQ.length > 0) {
                console.log("Questions in common :")
                commonQ.forEach(q => logQ(q))
            } else {
                console.log("Exam 1 " + "(" + exam1.name + ") and Exam 2 " + "(" + exam2.name + ") have no questions in common.")
            }
            dddl()
            if (exam1OnlyQ.length > 0) {
                console.log("Questions that are only in Exam 1 " + "(" + exam1.name + ") :")
                exam1OnlyQ.forEach(q => logQ(q))
            } else {
                console.log("All questions of Exam 1 " + "(" + exam1.name + ") are also in Exam 2 " + "(" + exam2.name + ").")
            }
            dddl()
            if (exam2OnlyQ.length > 0) {
                console.log("Questions that are only in Exam 2 " + "(" + exam2.name + ") :")
                exam2OnlyQ.forEach(q => logQ(q))
            } else {
                console.log("All questions of Exam 2 " + "(" + exam2.name + ") are also in Exam 1 " + "(" + exam1.name + ").")
            }

        } else {
            if (!exam1 && exam2) logger.error("Couldn't load exam 1.")
            else if (!exam2 && exam1) logger.error("Couldn't load exam 2 : '%s'.", args2.examName)
            else logger.error("Both exam couldn't be loaded.")
        }
    })

    .command("compare profile", "Compares an exam's profile with the mean profile of the loaded banks")
    .argument("[exam-name]", "Exam's name")
    .action(({logger, args}) => {
        let firstLoadedExam = exmModule.getLoadedExam()
        let selectedExam = firstLoadedExam
        if (args.examName) {
            if (firstLoadedExam.name !== args.examName) {
                selectedExam = exmModule.loadExam(args.examName)
            }
        }
        if (selectedExam) {
            let loadedBanksQuestions = getAllQuestions()
            let loadedBanks = banksModule.getLoadedBanks()
            let loadedBanksCount = loadedBanks.length
            if (loadedBanksCount === 0) {
                logger.error("No banks loaded. Cannot compute loaded banks' average profile.")
                process.exit(-1)
            }
            let exmQTypes = Object.keys(qst.qTypes).reduce((dict, curr) => {
                dict[qst.qTypeToStr(qst.qTypes[curr])] = selectedExam.questions.filter(q => q.type === qst.qTypes[curr]).length
                return dict
            }, {})

            let banksQTypes = Object.keys(qst.qTypes).reduce((dict, curr) => {
                dict[qst.qTypeToStr(qst.qTypes[curr])] = loadedBanksQuestions.filter(q => q.type === qst.qTypes[curr]).length / loadedBanksCount
                return dict
            }, {})

            chartModule.compareProfile(exmQTypes, selectedExam.name, banksQTypes, loadedBanks.map(b => b.name), logger)
            if (firstLoadedExam && selectedExam !== firstLoadedExam) {
                firstLoadedExam.load()
            }
        } else {
            noExamLoaded(logger)
        }

    })


    .command("", "\n------------------[VCARD]------------------")
    // Vcards creer les vcard et les enregistrer dans un fichier.
    .command("create vcard", "Interactive vcard generator")
    .alias("new vCard")
    .alias("vcard")
    //.argument('<path>','Where you want to put the vCard')
    .action(() => {
        let card = vCard.createVcard()
        console.log(card.getFormattedString())
        let verif = prompt('Are all these informations rights ?[yes/no] ').toLowerCase()

        while (verif === "no") {
            let card1 = vCard.createVcard()
            console.log(card1.getFormattedString())
            verif = prompt('Are all these informations rights ?[yes/no] ').toLowerCase()
        }
        card.version = '4.0' //can also support 2.1 and 4.0, certain versions only support certain fields

        //save to file
        card.saveToFile('./lib/vCards/vCard_genere/' + card.firstName + ' ' + card.lastName + '.vcf')


    })


program.run()

const displayQuestion = (q, options) => {

    let qStr = q.key + " ".repeat(Math.max(1, 3 - q.key.toString().length)) + "-> "
    if (options.fullTitle) {
        qStr += q.title
    } else {
        qStr += q.refs.id
    }
    let typeStr = " " + "-".repeat(Math.max(3, 45 - qStr.length)) + " " + qst.qTypeToStr(q.type)

    console.log(qStr + typeStr)
}
const displayQuestions = (questions, options) => {
    if (options.raw) {
        let indicator = "KEY -> TITLE"
        console.log(indicator + " " + "-".repeat(Math.max(3, 45 - "KEY -> TITLE ".length)) + " TYPE")
        dddl()
        questions.forEach(q => {
            let qStr = " ".repeat(Math.max(1, 3 - q.key.toString().length)) + q.key + " -> " + q.title
            let typeStr = " " + "-".repeat(Math.max(3, 45 - qStr.length)) + " " + qst.qTypeToStr(q.type)
            console.log(qStr + typeStr)
        })
    } else {
        let classifiedQuestions = qst.classify(questions)
        let indicator = "*UNIT\n     +PAGE\n     \t KEY -> TITLE " + "-".repeat(Math.max(3, 45 - "KEY-> TITLE".length)) + " TYPE\n"
        console.log(indicator)

        Object.entries(classifiedQuestions).forEach((e) => {
            let [unit, pages] = e
            console.log("*" + unit)
            Object.entries(pages).forEach((e) => {
                [pageN, qs] = e
                console.log('     +p' + pageN)
                if (qs.length > 0) {
                    qs.forEach((q) => {
                        process.stdout.write('\t  ')
                        displayQuestion(q, options)
                    })
                }
            })
        })
    }

}

function getAllQuestions() {
    return banksModule.getLoadedBanks().reduce((acc, curr) =>
        acc.concat(curr.getAllQuestions()), [])
}

function noBankLoaded(logger) {
    logger.error("There are no banks loaded into the program\nUse 'load bank <bank-name>' to load one.")
}

function noExamLoaded(logger) {
    logger.error("No exam is currently loaded into the program.\nUse 'load exam <exam-name>' to load one.")
}


function logEach(strArray) {
    strArray.forEach(str => console.log(str))
}

module.exports = {cli: program.run}