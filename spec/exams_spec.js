const bks = require('../lib/banks.js')
const qst = require('../lib/question.js')
const parser = require('../lib/parser.js')
const exm = require('../lib/exam.js')
const utils = require('../lib/utils.js');

describe("Testing the ability to export questions", function(){
	
	beforeAll(function() {
		//Unloading all banks ...
		bks.unloadAllBanks()
		this.chosenBankName='EM-U42-Ultimate'
		//Loading this.chosenBankName...
		this.bank = new bks.Bank(this.chosenBankName)
		this.bank.load()
		this.bankText = utils.fgets(utils.path.join(bks.banksDir,this.chosenBankName+".gift"))
		this.loadQuestions = () => {
			return Object.values(this.bank.pages).reduce((acc,curr)=>
				acc.concat(curr)
			,[])
		}
		this.bankQNumber=4
		
	});
	
	it("Can create an exam and add questions to it", function() {
		let createdExam = new exm.Exam(".unit_tests_exam",[])
		this.loadQuestions().forEach(q => {
			createdExam.addQuestion(q,()=>{},true)
		});
		expect(createdExam.questionsNumber).toBe(this.loadQuestions().length)
		let titles=[]
		for(let i=1; i<=this.bankQNumber; i++){
			titles.push("EM U42 Ultimate q"+i)
		}
		expect(createdExam.questions.map(q=>q.title)).toEqual(titles)
	})

	it("Can remove questions from an exam", function() {
		let createdExam = new exm.Exam(".unit_tests_exam",[])
		let loadedQuestions = this.loadQuestions()
		loadedQuestions.forEach(q => {
			createdExam.addQuestion(q,()=>{},true)
		});

		createdExam.rmQuestion(2,null)
		expect(createdExam.questionsNumber).toBe(loadedQuestions.length-1)
		
		let titles=[]
		for(let i=1; i<=this.bankQNumber; i++){
			titles.push("EM U42 Ultimate q"+i)
		}
		let allTitlesButThatOfQ2 = titles.slice(0,1).concat(titles.slice(2,this.bankQNumber))
		expect(createdExam.questions.map(q=>q.title)).toEqual(allTitlesButThatOfQ2)
		expect(createdExam.questions.map(q=>q.title).includes('EM U42 Ultimate q2')).toBe(false)
	})

	it("Can swap 2 questions of an exam", function() {
		let createdExam = new exm.Exam(".unit_tests_exam",[])
		let loadedQuestions = this.loadQuestions()
		loadedQuestions.forEach(q => {
			createdExam.addQuestion(q,()=>{},true)
		});
		oldCreatedExam=JSON.parse(JSON.stringify(createdExam))
		
		let key1=1
		let key2=3
		createdExam.swapQuestions(key1,key2,()=>{})
		createdExam=JSON.parse(JSON.stringify(createdExam))
		expect(createdExam.questionsNumber).toBe(oldCreatedExam.questionsNumber)
		expect(createdExam.questions[key1-1].title).toEqual(oldCreatedExam.questions[key2-1].title)
		expect(createdExam.questions[key2-1].title).toEqual(oldCreatedExam.questions[key1-1].title)
	})

	it("Can save an exam as a gift file", function() {
		let createdExam = new exm.Exam(".unit_tests_exam",[])
		let loadedQuestions = this.loadQuestions()
		loadedQuestions.forEach(q => {
			createdExam.addQuestion(q,()=>{},true)
		});
		let giftPath = utils.path.join(__dirname,".unit_tests_exported_gift")
		createdExam.saveGift(giftPath)
		expect(utils.fexists(giftPath)).toBe(true)
	})

});