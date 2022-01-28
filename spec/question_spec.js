
const qst = require('../lib/question.js')
const parser = require('../lib/parser.js')
const utils = require('../lib/utils.js');

describe("Testing the ability to export questions :", function(){
	
	beforeAll(function() {

		this.giftQToLoad={}

		this.loadQ = (qType) => parser.parse(this.giftQToLoad[qType])[0]

		this.giftQToLoad[qst.qTypes.SHORT_ANSWER] =`//From The Hitchhiker's Guide to the Galaxy
::EM U42 Ultimate q2::Deep Thought said " {
	=forty two#Correct according to The Hitchhiker's Guide to the Galaxy!
	=42#Correct, as told to Loonquawl and Phouchg
	=forty-two#Correct!
}  is the Ultimate Answer to the Ultimate Question of Life, The Universe, and Everything."`

	this.giftQToLoad[qst.qTypes.NUMERICAL] = `::EM U42 Ultimate q5::En quelle année est né Ulysses S. Grant ? {#
	=1822:0#TB
	=%50%1822:2#okey
}`

	this.giftQToLoad[qst.qTypes.MATCHING] =`::EM U42 Ultimate q6::Appariez les pays suivants avec les capitales correspondantes. {
	=Canada -> Ottawa
	=Italie -> Rome
	=Japon -> Tokyo
	=Inde -> New Delhi
}`

	this.giftQToLoad[qst.qTypes.MULTI_CHOICE] =`::EM U42 Ultimate q1::What's the answer to this multiple-choice question? {
	~wrong answer#feedback comment on the wrong answer
	~another wrong answer#feedback comment on this wrong answer
	=right answer#Very good!
}`

	this.giftQToLoad[qst.qTypes.TRUE_FALSE] =`::EM U42 Ultimate q3::42 is the Absolute Answer to everything.{
	FALSE#42is the Ultimate Answer.#You gave the right answer.
}`
	this.giftQToLoad[qst.qTypes.DESCRIPTION]=`// U5 p36-37 Reading

	::EM U5 p37 Reading 1.0 Text::[html]<p><i>You are going to read an article about a woman who tried out a new kind of food. Read the text once quickly and answer the first question below.</i></p>
	  <p>Last week, I posted a picture of my supper on Facebook. Never before has a post about a meal drawn so much <u>controversy</u> from friends. The reason? I was about to tuck into some Huel, a vegan powdered food that claims to contain everything the body needs, according to current government guidelines on <u>nutrition</u>.</p>
	  <p>This was on day 10 of my journey with Huel, the powdered food which has become something of a sensation. It sold out three times in the first month after its launch last year. Company founder Julian Hearn said his plan was not to replace food in our diets, but to offer a healthy, sustainable alternative to junk food and ready meals. After taking the stuff for three weeks it’s a concept I've surprised myself by buying into – and I’m not alone. Some 400,000 Huel meals have been sold since June, in more than 30 countries. Huel comes in a large, plain white bag with a scoop and instructions. One level scoop of Huel (38g) equates to 156 calories. You’re advised to use an online calorie counter to calculate how many calories you should be consuming. At 167 cm and 63 kg and with a very active lifestyle, I need 2,233 calories daily to maintain my weight. I began my adventure with Huel one busy evening when, <u>engrossed</u> in work, I didn’t want to stop to cook.</p>
	  <p>The instructions suggest adding some flavour when you start and to introduce Huel slowly. I blended three scoops with 550ml of water and a banana: a ‘meal’, according to the packet, and the equivalent of eating a sandwich. The first gulp of creamy, vanilla-tasting liquid seemed harmless, but the following sips got smaller as I <u>struggled</u> to swallow it and couldn’t finish, mainly because I found it so filling. Not eating felt strange but I went to bed feeling satisfied and with no ill effects. Ordinarily, I eat very healthy meals, so I notice when I’ve consumed any kind of junk but not with Huel, despite feeling rather worried when I looked at the lists on the label. The main ingredients are oats, pea protein, brown rice protein and flaxseeds followed by what looked like a load of chemicals. [line 38] According to Julian Hearn these provide vitamins and minerals.</p
	  <p>Over the first few days, I hated the sugary smell of Huel and its sweet taste, [line 40] but by the end of the week, I’d got the hang of it: one meal a day, best consumed for breakfast. I found it really useful during a busy working week. It was highly convenient having my dishwasher virtually unused and my rubbish bin empty. Besides, because I intentionally restricted my calorie intake to rid my body of some excess weight I’d put on over Christmas, by the end of the week I had lost 3 kilos.</p>
	  <p>Week two was harder. On two Huel meals a day I started to really miss eating. I love cooking and eating is a highly social occasion for me. But when I did sit down to a proper meal, I savoured every single mouthful. Huel had <u>heightened</u> my appreciation for food. Most encouragingly though, I was feeling great. There was no difference in energy levels at the gym and my body tolerated it well.</p>
	  <p>In week three, I managed two full days of only Huel before I broke. I missed mealtimes and the <u>therapy</u> of cooking after a long day. But even with the experiment over, I continued with one Huel meal a day – especially when on the run, which is exactly how the powder is meant to be used.</p>
	  <p>Ironically, if I’d posted a picture of a burger from a fast-food chain on my Facebook page, it would have attracted plenty of thumbs up – but it’s junk. Huel, in my opinion, is not.</p>`

	this.embedded_SA = `::EM U5 p38 Gra2 passive forms::
// CLOZE
Complete the email with the correct active or passive form of the verbs in brackets.

Dear Julia,
You'll never guess what {1:SA:=has happened} (happen)! Our lovey new car {1:SA:=has been stolen} (steal)!
One day last week Jack went out to be yhe beach for a swim and as usual he {1:SA:=hid} (hide) the car keys in the toe of his shoe. When he came out of the water, he {1:SA:=didn't notice~=did not notice} (not notice) anything suspicious. It didn't look as if his clothes {1:SA:=had been touched} (touch). When he started to put them on, however, he realised that the keys {1:SA:=had been taken} (take) and when he got to the car park, of course, the car was gone too.
The police say there is a gang of car thieves who {1:SA:=are known} (know) to be operating in the area. They think Jack {1:SA:=was being watched} (watch) as he arrived at the beach. The thieves saw where he had parked the car and then where the keys {1:SA:=were hidden~=had been hidden} (hide).
It was almost two weeks ago now and although we hope it {1:SA:=will be found} (find), we're beginning to think we might never see it again.
Well, that's all from me. Write soon and tell me all your news.
Love,
Raquel`

	this.embedded_MC=`::U3 p31 6 -ed adjectives and prepositions:: Choose the correct preposition.

What sports do you get excited {1:MC:~with~=about}? What sports do you find exciting?
Do you ever get frustrated {1:MC:~on~=with} a sportsperson/team? Which person/team do you find frustrating?
Who are you impressed {1:MC:~=by~for}? Who do you find impressive?
Who or what do you get annoyed {1:MC:~of~=by}?
What do you sometimes feel embarrassed {1:MC:~in~=by}? Who do you find embarrassing?
`

	});
	
	it("Can load a DESCRIPTION", function(){
		let q = this.loadQ(qst.qTypes.DESCRIPTION)
		expect(q.refs.unit).toBe("EM U5")
		expect(q.refs.pageNumber).toBe(37)
		expect(q.isConventionnal).toBe(true)
		expect(q.title).toBe('EM U5 p37 Reading 1.0 Text')
		expect(q.type).toBe(qst.qTypes.DESCRIPTION)
		expect(q.text.trim().includes(("<p>Last week, I posted a picture of my supper on Facebook. "
		+"Never before has a post about a meal drawn so much <u>controversy</u> from friends. "
		+"The reason? I was about to tuck into some Huel, a vegan powdered food that claims to contain everything the body needs, according to current government guidelines on <u>nutrition</u>.</p>").trim())
			).toBe(true)
		expect(q.format).toBe('html')
	});

	it("Can load a SHORT ANSWER question", function(){
		let q = this.loadQ(qst.qTypes.SHORT_ANSWER)
		expect(q.refs.unit).toBe("EM U42")
		expect(q.refs.pageNumber).toBe(undefined)
		expect(q.isConventionnal).toBe(true)
		expect(q.title).toBe('EM U42 Ultimate q2')
		expect(q.type).toBe(qst.qTypes.SHORT_ANSWER)
		expect(q.text.trim().includes(("is the Ultimate Answer to the Ultimate Question of Life, The Universe, and Everything.").trim())
			).toBe(true)
		
		expect(q.format).toBe('moodle')
		
		let choices = q.choices

		expect(choices[0].text).toBe("forty two")
		expect(choices[0].feedback).toBe("Correct according to The Hitchhiker's Guide to the Galaxy!")
		expect(choices[0].isCorrect).toBe(true)

		expect(choices[1].text).toBe("42")
		expect(choices[1].feedback).toBe("Correct, as told to Loonquawl and Phouchg")
		expect(choices[1].isCorrect).toBe(true)

		expect(choices[2].text).toBe("forty-two")
		expect(choices[2].feedback).toBe("Correct!")
		expect(choices[2].isCorrect).toBe(true)

		expect(choices.map(c=>c.text).includes('41')).toBe(false)

	});

	it("Can load a NUMERICAL question", function(){
		let q = this.loadQ(qst.qTypes.NUMERICAL)
		expect(q.refs.unit).toBe("EM U42")
		expect(q.refs.pageNumber).toBe(undefined)
		expect(q.isConventionnal).toBe(true)
		expect(q.title).toBe('EM U42 Ultimate q5')
		expect(q.type).toBe(qst.qTypes.NUMERICAL)
		expect(q.text.trim().includes(("En quelle année est né Ulysses S. Grant ? ").trim())).toBe(true)
		expect(q.format).toBe('moodle')

		let choices = q.choices

		expect(choices[0].number).toBe(1822)
		expect(choices[0].feedback).toBe("TB")
		expect(choices[0].isCorrect).toBe(true)
		expect(choices[0].range).toBe(0)
		expect(choices[0].weight).toEqual(null)

		expect(choices[1].number).toBe(1822)
		expect(choices[1].feedback).toBe("okey")
		expect(choices[1].isCorrect).toBe(true)
		expect(choices[1].range).toBe(2)
		expect(choices[1].weight).toBe(50)
		
	});

	it("Can load a MULTICHOICE question", function(){
		let q = this.loadQ(qst.qTypes.MULTI_CHOICE)
		expect(q.refs.unit).toBe("EM U42")
		expect(q.refs.pageNumber).toBe(undefined)
		expect(q.isConventionnal).toBe(true)
		expect(q.title).toBe('EM U42 Ultimate q1')
		expect(q.type).toBe(qst.qTypes.MULTI_CHOICE)
		expect(q.text.trim().includes(("What's the answer to this multiple-choice question?").trim())).toBe(true)
		expect(q.format).toBe('moodle')

		let choices = q.choices

		expect(choices[0].text).toBe("wrong answer")
		expect(choices[0].feedback).toBe("feedback comment on the wrong answer")
		expect(choices[0].isCorrect).toBe(false)

		expect(choices[1].text).toBe("another wrong answer")
		expect(choices[1].feedback).toBe("feedback comment on this wrong answer")
		expect(choices[1].isCorrect).toBe(false)

		expect(choices[2].text).toBe("right answer")
		expect(choices[2].feedback).toBe("Very good!")
		expect(choices[2].isCorrect).toBe(true)
	});

	it("Can load a TRUE/FALSE question", function(){
		let q = this.loadQ(qst.qTypes.TRUE_FALSE)
		expect(q.refs.unit).toBe("EM U42")
		expect(q.refs.pageNumber).toBe(undefined)
		expect(q.isConventionnal).toBe(true)
		expect(q.title).toBe('EM U42 Ultimate q3')
		expect(q.type).toBe(qst.qTypes.TRUE_FALSE)
		expect(q.text.trim().includes(("42 is the Absolute Answer to everything.").trim())).toBe(true)
		expect(q.isTrue).toBe(false)
		expect(q.correctFeedback).toBe('You gave the right answer.')
		expect(q.incorrectFeedback).toBe('42is the Ultimate Answer.')
		expect(q.format).toBe('moodle')
	});

	it("Can load a MATCH PAIRS question", function(){
		let q = this.loadQ(qst.qTypes.MATCHING)
		expect(q.refs.unit).toBe("EM U42")
		expect(q.refs.pageNumber).toBe(undefined)
		expect(q.isConventionnal).toBe(true)
		expect(q.title).toBe('EM U42 Ultimate q6')
		expect(q.type).toBe(qst.qTypes.MATCHING)
		expect(q.text.trim().includes(('Appariez les pays suivants avec les capitales correspondantes.').trim())).toBe(true)
		
		let pairs = q.matchPairs
		expect(pairs[0].subquestion).toBe('Canada')
		expect(pairs[0].subanswer).toBe('Ottawa')

		expect(pairs[1].subquestion).toBe('Italie')
		expect(pairs[1].subanswer).toBe('Rome')

		expect(pairs[2].subquestion).toBe('Japon')
		expect(pairs[2].subanswer).toBe('Tokyo')

		expect(pairs[3].subquestion).toBe('Inde')
		expect(pairs[3].subanswer).toBe('New Delhi')
	});

	it("Can load embedded SA questions", function(){
		let q
		console.log()
		try{
			q = parser.parse(this.embedded_SA)
			console.log("1 : " + q)
		}
		catch(e){
			console.log("!-- Unable to read embedded SA questions for now --!")
		}
		console.log("2 : " + q)
		expect(q).toBeDefined()
	});

	it("Can load embedded MC questions", function(){
		let q
		console.log()
		try{
			q = parser.parse(this.embedded_MC)
		}
		catch(e){
			console.log("!-- Unable to read embedded MC questions for now --!")
		}
		expect(q).toBeDefined()
	});
});