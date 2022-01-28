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
		//Loading this.chosenBankName ...
		this.bank = new bks.Bank(this.chosenBankName)
		this.bank.load()
		this.bankText = utils.fgets(utils.path.join(bks.banksDir,this.chosenBankName+".gift"))
		this.loadQuestions = () => {
			return Object.values(this.bank.pages).reduce((acc,curr)=>
				acc.concat(curr)
			,[])
		}
		
	});
	
	it("Can load as many questions as there are in the loaded bank", function(){
		expect(this.loadQuestions().length).toBe(parser.parse(this.bankText).length)
	});

	it("Can load a bank of question with its properties", function(){
		expect(this.bank.name).toBe(this.chosenBankName)
		expect(this.bank.pagesNumber).toBeDefined()
		expect(this.loadQuestions().length).toBeGreaterThan(0)
	});

	it("Can load questions from a bank containing questions with no page numbers", function(){
		console.log(this.bank)
		expect(this.bank.pagesNumber).toBe(0)
		expect(this.bank.pages["??"].length).toBeGreaterThan(0)
	});


});