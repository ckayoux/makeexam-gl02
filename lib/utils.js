#!/usr/bin/node
const fs = require('fs')
const path = require('path')

const prompt = require('prompt-sync')({sigint: true})

const fileStates = {
    EMPTY: null,
    WRONG_FORMAT: undefined,
    RIGHT: true,
    CONTENT_ALREADY_EXISTS: false
}

function getExistingFiles(dirPath, ext) {
    let files = fs.readdirSync(path.resolve(dirPath)).filter(f => {
        return (fs.existsSync(path.join(dirPath, f)) && fs.lstatSync(path.join(dirPath, f)).isFile()) //we get only files, not directories
    });
    if (ext) {
        return files.filter(f => path.extname(f) === ext);
    } else return files;
}

function getExistingFilesBasenames(dirPath, ext) {
    if (ext) {
        return getExistingFiles(dirPath, ext).map(f => path.basename(f, ext));
    } else return getExistingFiles(dirPath, ext).map(f => {
        if (f.includes(".")) return f.slice(0, f.lastIndexOf("."))
        else return f
    })
}

function fputs(filePath, str) {
    fs.open(path.resolve(filePath), 'w', (err, fd) => {
        if (err) throw err
        else {
            fs.writeSync(fd, str, (err, bytes) => {
                try {
                } catch (err) {
                    throw err;
                }
            })
        }
    })
}

function fappends(filePath, str) {
    fs.open(path.resolve(filePath), 'a', (err, fd) => {
        if (err) throw err
        else {
            fs.writeSync(fd, str + '\n', (err) => {
                if (err) throw err
            })
        }
    })
}

function fgets(filePath) {
    return fs.readFileSync(path.resolve(filePath), {encoding: 'utf-8', flag: 'r'})
}

function serialize(filePath, object, dealWithFileState) {
    let currentState = unserializeAll(filePath)
    if (currentState !== fileStates.EMPTY && currentState != fileStates.WRONG_FORMAT)
        if (currentState.map(o => JSON.stringify(o)).includes(JSON.stringify(object))) currentState = fileStates.CONTENT_ALREADY_EXISTS
    if (dealWithFileState(currentState)) {
        fappends(filePath, JSON.stringify(object))
        return true;
    }
}

function serializeOne(filePath, object) {
    try {
        fputs(filePath, JSON.stringify(object) + "\n")
        return true;
    } catch (e) {
        return false;
    }
}

function fempty(filePath) {
    return (!fs.existsSync(path.resolve(filePath)) || fgets(path.resolve(filePath).trim()) === "")
}

function fexists(file) {
    return fs.existsSync(path.resolve(file), (err) => {
        if (err) throw err
    })
}


function cp(filePath, dest) {
    fs.copyFileSync(path.resolve(filePath), path.resolve(dest), fs.constants.COPYFILE_EXCL, (err) => {
        if (err) throw err
    })
}

function rm(filePath) {
    fs.unlinkSync(filePath, (err) => {
        if (err) throw err
    })
}

function unserializeAll(filePath) {
    try {
        return fgets(filePath).slice(0, -1).split('\n').map(s => JSON.parse(s.trim()))
    } catch (e) {
        if (fempty(filePath)) return fileStates.EMPTY
        else return fileStates.WRONG_FORMAT
    }

}

function unserializeOne(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath))
    } catch (e) {
        console.log(e)
        if (fempty(filePath)) return fileStates.EMPTY
        else return fileStates.WRONG_FORMAT
    }

}

function getBaseName(filePath) {
    let fileAndItsExt = path.basename(filePath)
    if (fileAndItsExt.includes(".")) {
        return fileAndItsExt.slice(0, fileAndItsExt.lastIndexOf("."))
    } else
        return fileAndItsExt
}

function acceptKey(key, logger) {
    if (!isNaN(key) && typeof key === 'number' && Number.isInteger(key)) {
        return true
    } else {
        logger.error("Key must be an integer")
        process.exit(-1)
    }
}

const intersect = (ar1, ar2) => {
    return ar1.filter(elt => ar2.includes(elt))
}
const yesnoq = (ask) => {
    console.log(ask + " (y/n) : \n\t>>")
    let answer = prompt()
    if (answer.toLowerCase() != 'y' && answer.toLowerCase() != 'n') {
        answer = yesnoq("Please type in one of these characters")
    }
    return (answer === 'y')
}
const invite = (ask) => {
    console.log(ask + " :")
    return prompt("\t>>")
}
const getint = (ask) => {
    let str = invite(ask)
    let i = parseInt(str)
    if ((i || i === 0) && !isNaN(i)) {
        return i
    } else return getint(ask)
}

function ddl() {
    console.log("-----------------------------------------------------------")
}

function dddl() {
    console.log("  ·  ·  ·  ·  ·  ·  ·  ·   ·  ·  ·  ·  ·  ·  ·  ")
}

module.exports = {
    path: path,// rl : rl,
    intersect: intersect, acceptKey: acceptKey,
    getExistingFilesBasenames: getExistingFilesBasenames, getExistingFiles: getExistingFiles,
    fputs: fputs, fgets: fgets, fappends: fappends, fempty: fempty, fexists: fexists, cp: cp, rm: rm, fs: fs,
    serialize: serialize, unserializeAll: unserializeAll, fileStates: fileStates,
    serializeOne: serializeOne, unserializeOne: unserializeOne,
    getBaseName: getBaseName, yesnoq: yesnoq, prompt: prompt, invite: invite, getint: getint,
    ddl: ddl, dddl: dddl
}
