#!/usr/bin/node
const {fputs, fileStates, fs, path} = require('./utils')
const utils = require(path.join(__dirname, '/utils.js'))

const banksDir = path.join(__dirname, '/../banks/')
const loadedBanksFile = utils.path.join(banksDir + ".loaded_banks")
const parser = require(path.join(__dirname, '/parser.js'))
const regExps = {
    conventionnalName: {
        regExp: new RegExp(/([A-Z]*-)?U[0-9]+(-p[0-9](_[0-9]*)?)?-([A-Za-z0-9 ][\,\-_]?)*/),
        parse: (str) => regExps.conventionnalName.regExp.exec(str)[0],
    },
    conventionnalUnit: {
        regExp: new RegExp(/([A-Z]*-?U[0-9]+)/)
    },
    conventionnalPages: {
        regExp: new RegExp(/([A-Z]*-)?U[0-9]+-p([0-9]*)(_|-)?([0-9]*)?/),

    },
    conventionnalDescription: {
        regExp: new RegExp(/([A-Z]*-)?U[0-9]+(-p[0-9](_[0-9]*)?)?-(.*)/),
    }
}
regExps.conventionnalName.isConventionnal = (str) => (regExps.conventionnalName.regExp.exec(str) !== null)
regExps.conventionnalUnit.parse = (str) => regExps.conventionnalUnit.regExp.exec(str)[0]
regExps.conventionnalPages.hasPages = (str) => (regExps.conventionnalPages.regExp.exec(str) !== null)
regExps.conventionnalPages.parse = (str) => {
    if (regExps.conventionnalPages.hasPages(str)) {
        let firstPage = regExps.conventionnalPages.regExp.exec(str)[2]
        let lastPage = regExps.conventionnalPages.regExp.exec(str)[4]
        if (lastPage !== undefined) {
          return {
              first: firstPage,
              last: lastPage
            }
        } else return firstPage
    } else return undefined
}

regExps.conventionnalPages.hasPluralPages = str => (regExps.conventionnalPages.parse(str).last !== undefined)
regExps.conventionnalDescription.parse = (str) => regExps.conventionnalDescription.regExp.exec(str)[4]

if (!utils.fexists(loadedBanksFile)) utils.fputs(loadedBanksFile, "")

class Bank {
    name
    isConventionnal//"([A-Z]*-)?U[0-9]*(-p[0-9]*(_[0-9]*)?)?-([A-Za-z ][\,\-_]?)*"
    unit
    //pages
    pagesNumber
    description = ""
    additionnalQuestions = []

    static banksCount = 0

    constructor(full_name) {

        this.name = full_name
        if (regExps.conventionnalName.isConventionnal(full_name)) {
            this.isConventionnal = true
            this.unit = regExps.conventionnalUnit.parse(full_name)
            if (!regExps.conventionnalPages.hasPages(full_name)) {
                this.pages = undefined
                this.pagesNumber = 0
            } else if (regExps.conventionnalPages.hasPluralPages(full_name)) {
                this.pages = []
                let firstAndLastPages = regExps.conventionnalPages.parse(full_name)
                for (let i = firstAndLastPages.first; i <= firstAndLastPages.last; i++) {
                    this.pages.push(parseInt(i))
                }
                this.pagesNumber = this.pages.length
            } else {
                this.pages = [parseInt(regExps.conventionnalPages.parse(full_name))]
                this.pagesNumber = 1
            }
            this.description = regExps.conventionnalDescription.parse(full_name)
        } else {
            this.isConventionnal = false
            this.unit = full_name
            this.pages = undefined
            this.description = full_name
        }
        if (this.isConventionnal) {
            this.parseQuestions();
        } else {
            console.log("!--Cannot parse questions from banks with non-conventionnal namespaces yet--!")
        }

    }

    load() {
        return utils.serialize(loadedBanksFile, this, (fileState) => {
            if (fileState === utils.fileStates.WRONG_FORMAT) {
                console.log("Savefile " + utils.path.basename(loadedBanksFile) + " is corrupted, starting a brand new one")
                fputs(loadedBanksFile, "")
                return true;
            } else if (fileState === utils.fileStates.CONTENT_ALREADY_EXISTS) {
                console.log("The bank " + this.getName() + " is already loaded.")
                return false;
            } else {
                Bank.banksCount++
                return true;
            }
        })
    }

    unload(callback) {
        let loadedBanks = getLoadedBanks()
        let bToUnload = loadedBanks.find(b => b.name === this.name)

        if (bToUnload) {
            try {
                utils.fputs(loadedBanksFile, "")
                loadedBanks.filter(b => b.name !== this.name).forEach(b => {
                    b.load()
                });
                callback(true)
            } catch (e) {
                console.log(e)
                callback(false)
            }
        } else {
            callback(null)
        }
    }

    getName = () => this.name

    log = () => {
        console.log("Bank name : " + this.name)
        console.log("Conventionnal namespace : " + this.isConventionnal)
        console.log("Unit name : " + this.unit)
        if (this.pages === undefined) {
            console.log("No pages.")
            console.log("additionnalQuestions : " + this.additionnalQuestions)
        } else if (this.hasPages() && this.hasPluralPages()) {
            console.log("pages : " + this.pages)
        } else {
            console.log("Page : " + this.pages)
        }
        console.log("Description : " + this.description)
    }

    hasPages = () => (this.pages !== undefined)
    hasPluralPages = () => {
        if (this.hasPages()) return (this.pagesNumber > 1)
        else return false
    }

    parseQuestions = function () {
        let strToParse = (utils.fgets(utils.path.resolve(banksDir + this.name + ".gift")))

        let parsedQuestions = parser.parse(strToParse)
        if (this.hasPages()) {
            this.pages = this.pages.reduce((acc, curr) => {
                acc[curr] = parsedQuestions.filter(q =>
                    (curr === q.refs.pageNumber))
                return acc
            }, {})
        }

        if (!parsedQuestions) parsedQuestions = []
        this.additionnalQuestions = parsedQuestions.filter(q => (!"pageNumber" in q.refs))
        let missingPages = parsedQuestions.filter(q => {
            if ("pageNumber" in q.refs)
                if (q.refs.pageNumber) {
                    if (!this.pages[q.refs.pageNumber])
                        return true
                } else if (!q.refs.pageNumber)
                    return true
            return false
        }).reduce((acc, curr) => {
            if (!curr.refs.pageNumber) {
                if (!acc["??"])
                    acc["??"] = []
                acc["??"].push(curr)
            } else if (acc[curr.refs.pageNumber] === undefined) {
                if (curr.refs.pageNumber) {
                    acc[curr.refs.pageNumber] = []
                }
                acc[curr.refs.pageNumber].push(curr)
            } else {
                acc[curr.refs.pageNumber].push(curr)
            }
            return acc
        }, {})
        this.pages = Object.assign((this.pages) ? this.pages : {}, missingPages)

    }

    getQuestionsByPage(first, last) {
        let a = first
        if (!last) {

            if (this.pages[a]) {
                return this.pages[a]
            } else return []
        } else {
            let z = last
            let qs = []
            for (let i = a; i <= z; i++) {
                if (this.pages[i])
                    qs = qs.concat(this.pages[i])
            }
            return qs
        }

    }

    getAllQuestions() {
      return Object.values(this.pages).reduce((acc, curr) => acc.concat(curr), []).concat(this.additionnalQuestions)
    }

    getQuestionById(id) {
        return this.getAllQuestions().filter(q => (q.refs.id === id || q.refs.id + ".0" === id))//consider 2.0 equivalent to 2
    }

    getQuestionsByUnit(unit) {
        return this.getAllQuestions().filter(q => q.refs.unit === unit)
    }
}

function getLoadedBanks() {
    try {
        let loadedObjects = utils.unserializeAll(loadedBanksFile);
        if (loadedObjects === utils.fileStates.EMPTY) return []
        else if (loadedObjects === utils.fileStates.WRONG_FORMAT) {
            throw new Error('Error : corrupted savefile.')
        } else return utils.unserializeAll(loadedBanksFile).map(obj => new Bank(obj["name"]))
    } catch (e) {
        console.log("Couldn't read the loaded banks savefile, resetting it.")
        unloadAllBanks()
    }
}

function getAvailableBanksNames() {
    try {
        let loadedBanks = getLoadedBanks()
        return utils.getExistingFilesBasenames(banksDir, ".gift").filter(n => (!loadedBanks.map(b => b.name).includes(n)))
    } catch (e) {
        console.log("Error : couldn't access the banks directory.")
    }
}

function unloadAllBanks(dealWithFileStates) {
    let erase = false;
    try {
        if (dealWithFileStates) {
            if (utils.fempty(loadedBanksFile)) {
                if (dealWithFileStates(utils.fileStates.EMPTY)) {
                    erase = true;
                }
            } else {
                erase = true;
                dealWithFileStates(utils.fileStates.RIGHT)
            }
        } else {
            erase = true
        }
        if (erase) utils.fputs(loadedBanksFile, "")
    } catch (e) {
        throw e
    }
}

function noneIsLoaded() {
    return utils.fempty(loadedBanksFile)
}

function bankExists(bankName) {
    return utils.fexists(utils.path.join(banksDir, bankName + ".gift"))
}


function saveBank(bankFile) {
    utils.cp(bankFile, banksDir + utils.getBaseName(bankFile) + ".gift")
}

module.exports = {
    Bank: Bank,
    getLoadedBanks: getLoadedBanks,
    loadedBanksFile: loadedBanksFile,
    unloadAllBanks: unloadAllBanks,
    getAvailableBanksNames: getAvailableBanksNames,
    noneIsLoaded: noneIsLoaded,
    saveBank: saveBank,
    bankExists: bankExists,
    banksDir: banksDir
}
