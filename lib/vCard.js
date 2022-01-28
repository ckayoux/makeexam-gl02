var vCardsJS = require('vcards-js');
const prompt = require('prompt-sync')({
    sigint: true
});

//create a new vCard
function createVcard() {
    var vCard = vCardsJS();
    let add = prompt("Do you want to make a full card ? It may be a bit long...   [yes/no] :").toLowerCase();
    //Identite de base
    vCard.firstName = prompt('What is your firstName?: ');
    vCard.middleName = prompt('What is your middleName?: ');
    vCard.lastName = prompt('What is your last name?: ');
    vCard.organization = prompt('What is the name of your organisation?: ');
    vCard.uid = prompt('What is your id number ?: ');
    vCard.gender = prompt('Gender M/F ?');


    vCard.workPhone = prompt('What is your workphone number ?: ');
    vCard.cellPhone = prompt('What is your cellphone number ?: ');
    vCard.title = prompt('What is your profesion?: ');
    vCard.email = prompt('What is  your personal email ?: ');
    vCard.workEmail = prompt('What is  your profesional email ?: ');
    vCard.url = prompt('What is the url of your personal website ?: ');
    vCard.workUrl = prompt('What is the url of your profesional website ?: ');
    //Adress work
    vCard.workAddress.label = 'Work Address';
    vCard.workAddress.street = prompt('Number + Street name: ');
    vCard.workAddress.city = prompt('City : ');
    vCard.workAddress.postalCode = prompt('Psotal Code : ');
    vCard.workAddress.countryRegion = prompt('Country : ');

    vCard.note = prompt('You can add some additionnal informations here: ');

    if (add === "yes") {
        //set social media URLs
        vCard.birthday = new Date(prompt('Year of birth ?: '), prompt('Month of birth ?: '), prompt('Day of birth ?: '));
        vCard.socialUrls['facebook'] = prompt('What is  your facebook url ?: ');
        vCard.socialUrls['linkedIn'] = prompt('What is  your linkedin url ?: ');
        vCard.socialUrls['twitter'] = prompt('What is  your twitter url ?: ');
        vCard.socialUrls['instagram'] = prompt('What is  your instagram url ?: ');
        // home adress
        vCard.homeAddress.label = 'Home Address';
        vCard.homeAddress.street = prompt('Number + Street name: ');
        vCard.homeAddress.city = prompt('City : ');
        vCard.homeAddress.postalCode = prompt('Postal Code : ');
        vCard.homeAddress.countryRegion = prompt('Country : ');
        vCard.namePrefix = prompt('Mr. ou Mrs ?');

        vCard.role = prompt('What is your role in your society ?:  ');

        //set other phone numbers
        vCard.homePhone = prompt('What is your homephone number ?: ');

        //set fax/facsimile numbers
        vCard.homeFax = prompt('What is your homefax number ?: ');
        vCard.workFax = prompt('What is your workfax number ?: ');

        let choix = prompt('Do you want to add a picture ?:[yes/no]  ').toLowerCase();
        if (choix === "yes") {
            console.log("Your picture must be a file in the repertory lib/vCards/images");
            let way = prompt('Write the name of your picutre like <name.png>?:');
            vCard.photo.embedFromFile('./lib/vCards/images/' + way);

        }
    }
    return vCard;
}

module.exports = {
    createVcard: createVcard,
}