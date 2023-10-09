import { Rule, RuleInterface } from '@Typetron/Validation'
import { Type } from '@Typetron/Support'
import { File } from '@Typetron/Storage'

export function FileExtension(extensions: string[], message?: string): Type<RuleInterface> {
    return class extends Rule {
        identifier = 'fileExtension'

        passes(attribute: string, value?: File): boolean {
            return value?.extension ? extensions.includes(value.extension) : false
        }

        message(attribute: string, value?: File): string {
            const messagePart = extensions.length === 1
                ? `the '.${extensions.first()}' extension`
                : `these extensions: ${extensions.map(extension => `.${extension}`).join(', ')}`

            return message ?? `The ${attribute} must have ${messagePart}`
        }
    }
}
