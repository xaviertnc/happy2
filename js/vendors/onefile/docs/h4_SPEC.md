#Happy2 - Design Document

#Service workflow

Catalog all HTML elements: docs, forms, fields, inputs, messages
   into an elements hierachry.

1. For each doc, form, field and input element get from HTML:
    - Its name/id
    - Its happy state
    - Its modified state
    - Its configuration: Any custom behaviour settings
    - Its status: [disabled, hidden, readonly]  ? inactive : active
    - Any displayed messages

2. For each field and input element, get from HTML:
    - Its type
    - Its initial value
    - Its current value
    - Its field/tab order
    - Validation rules

3. For each field element, bind validation events based on config:
    - on input focus
    - on input blur
    - on input change

4. For each form, bind "onSubmit" if allowed in options

5. Bind global page "onExit" event if allowed in settings

6. Do inital validation of all fields if allowed in settings

7. On happy field validation:
    - Recalc the current field value
    - Get field validations and parameters
    - Perform conditional validation/s. (e.g. onFormSubmit vs. onInputChanged)
    - Update or create messages based on validation result.
    - Update happy state
    - Update modified state
    - Update element in DOM
    - Update element messages in DOM
    - Trigger element "onStateChanged(happy, modified, status)" event if anything changed

---
#Conventions
1. No nested docs, forms or fields.

---
#Example Use Cases

* FORM 1
    - First Name (text)
    - Last Name (text)
    - Age (number)
    - Comment (textarea)




