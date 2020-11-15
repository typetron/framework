import { suite, test } from '@testdeck/mocha'
import { Email } from '../../Validation'
import { expect } from 'chai'

@suite
class RulesTest {
    @test
    shouldLimitStringAddingThreeDotsAtTheEnd() {
        const validEmails = [
            'email@example.com',
            'firstname.lastname@example.com',
            'email@subdomain.example.com',
            'firstname+lastname@example.com',
            'email@123.123.123.123',
            'email@[123.123.123.123]',
            '"email"@example.com',
            '1234567890@example.com',
            'email@example-one.com',
            '_______@example.com',
            'email@example.name',
            'email@example.museum',
            'email@example.co.jp',
            'firstname-lastname@example.com',
        ]
        const invalidEmails = [
            'plainaddress',
            '#@%^%#$@#$@#.com',
            '@example.com',
            'Joe Smith <email@example.com>',
            'email.example.com',
            'email@example@example.com',
            '.email@example.com',
            'email.@example.com',
            'email..email@example.com',
            'あいうえお@example.com',
            'email@example.com (Joe Smith)',
            'email@example',
            'email@-example.com',
            'email@example..com',
            'Abc..123@example.com',
        ]

        const rule = new Email()

        validEmails.forEach(email => {
            expect(rule.passes('', email), email).to.be.equal(true)
        })

        invalidEmails.forEach(email => {
            expect(rule.passes('', email), email).to.be.equal(true)
        })
    }

}
