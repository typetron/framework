import { suite, test } from '@testdeck/mocha'
import { MinLength, Required } from '../../Validation'
import { Field, Form, Rules } from '@Typetron/Forms'
import { expect } from 'chai'
import { Optional } from '@Typetron/Validation/Rules/Optional'

@suite
class FormsTest {

    @test
    validatesFormBasedOnValidators() {

        class UserForm extends Form {
            @Field()
            @Rules(Required)
            name: string
        }

        const formData = {
            name: 'John'
        }
        const form = new UserForm()
        form.fill(formData)

        expect(form.valid()).to.be.equal(true)
    }

    @test
    showsErrorWhenFormIsInvalid() {
        class UserForm extends Form {
            @Field()
            @Rules(Required)
            name: string
        }

        const form = new UserForm()

        expect(form.valid()).to.be.equal(false)
    }

    @test
    doesNotGiveErrorForOptionalFieldsThatHaveValidatorsAlready() {
        class UserForm extends Form {
            @Field()
            @Rules(Optional, MinLength(10))
            name?: string
        }

        const validForm = new UserForm()

        expect(validForm.valid()).to.be.equal(true)

        const invalidForm = new UserForm()
        invalidForm.fill({name: ''} as object)

        expect(invalidForm.valid()).to.be.equal(false)
    }

}
