import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms'
import { Form, FormField } from '@Typetron/Forms'
import { Constructor } from '@Typetron/Support'

export class FormBuilder {
    static build(form: typeof Form & Constructor<Form>): FormGroup {
        const controls: Record<string, AbstractControl> = {}
        const formFields = Object.values(form.fields()) as FormField[]
        Object.values(formFields).forEach(field => {
            controls[field.name] = new FormControl(undefined, {validators: this.getValidators(field)})
        })
        return new FormGroup(controls)
    }

    private static getValidators(field: FormField): ValidatorFn {
        return control => field.validate(control.value) as unknown as ValidatorFn
    }
}
