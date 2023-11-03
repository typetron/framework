import type { AbstractControl, ValidatorFn } from '@angular/forms'
import { FormControl, FormGroup } from '@angular/forms'
import type { Form, FormField } from '@Typetron/Forms'
import { Constructor } from '@Typetron/Support'

export class FormBuilder {
    static build<T extends Form>(form: typeof Form & Constructor<T>): FormGroup {
        const controls: Record<string, AbstractControl> = {}
        const formFields = Object.values(form.fields()) as FormField[]
        const instance = new (form as unknown as Constructor<T>)()
        Object.values(formFields).forEach(field => {
            controls[field.name] = new FormControl(
                instance[field.name as keyof Form],
                {validators: this.getValidators(field)}
            )
        })
        return new FormGroup(controls)
    }

    private static getValidators(field: FormField): ValidatorFn {
        return control => field.validate(control.value) as unknown as ValidatorFn
    }
}

