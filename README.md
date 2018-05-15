HAPPY2 JS DEV
=============

All HappyItems have a "type" that groups them together.
Messages of the same type (Like a spesific error type) can be found and updated or removed as a group.
The same goes for message anchors, fields and forms.

HappyItem Classes should have methods to find and parse DOM elements representing that specific type of item.
They should also have methods to detect the 'value', properties and state of an item. The value of an item might be
a calculation based on the item's sub-component values.



## HAPPY STRUCTURE

### HappyDocument
- HappyDocMessageAnchors
  - HappyDocMessages

  ### HappyForms
  - HappyFormMessageAnchors
    - HappyFormMessages

    ### HappyFields
    - HappyFieldMessageAnchors
      - HappyFieldMessagesDefaultAnchor
        - HappyFieldDefaultGroupMessages
      - HappyFieldMessagesSummaryAnchor
        - HappyFieldSummaryGroupMessages
      - HappyFieldMessagesExtraAnchor
        - HappyFieldExtraGroupMessages

      ### HappyInputs
      - HappyInputMessageAnchors
        - HappyInputMessages
          - HappyMessage
          - HappyType1Message
          - HappyType2Message
          - HappyType1Message
          - HappyType3Message



## HAPPY PROPERTIES

- HappyDocument
  - selector
  - formSelector
  - fieldSelector
  - inputSelector
  - inputContainerSelector
  - messageAnchorSelector
  - messageSelector

- HappyForm
  - selector

- HappyField
  - selector

- HappyInput
  - selector



## HAPPY DATA

- HappyDocument
  - elm
  - customMessageTypes
  - customMessageAnchorTypes
  - customInputTypes
  - customFieldTypes
  - customFormTypes
  - validators
  - formDOMElements
  - happyForms
  - messageAnchorDOMElements
  - messageAnchors
  - messageDOMElements
  - messages
  - validations

- HappyForm
  - elm
  - fieldDOMElements
  - happyFields
  - messageAnchorDOMElements
  - messageAnchors
  - messageDOMElements
  - messages
  - validations

- HappyField
  - elm
  - inputDOMElements
  - happyInputs
  - messageAnchorDOMElements
  - messageAnchors
  - messageDOMElements
  - messages
  - validations

- HappyInput
  - elm
  - messageAnchorDOMElements
  - messageAnchors
  - messageDOMElements
  - messages
  - validations



## HAPPY STATE

- Document
  - happy
  - unhappy
  - modified
  - disabled
  - visible
  - noValidate
  - noModify

- Forms
  - happy
  - unhappy
  - modified
  - disabled
  - visible
  - noValidate
  - noModify

- Fields
  - happy
  - unhappy
  - modified
  - disabled
  - visible
  - noValidate
  - noModify
  - InitialValue
  - Value

- Inputs
  - happy
  - unhappy
  - modified
  - disabled
  - visible
  - noValidate
  - noModify
  - InitialValue
  - Value



## PROCESS

### Initialize

1. Define and Add custom happy item classes
  - Custom item classes must all have methods to find and parse the DOM element of the specific type of item.
  - Custom item classes can be decendants of the main item classes like:
    HappyDocument, HappyForm, HappyField, HappyInput and HappyItem.

2. Define / Override default happy item slectors
  - Specify a selector to select the HappyDocument element
  - Specify a selector to select all HappyForm elements
    - OR Override the HappyDocument::findFormDOMElements method (i.e. Custom HappyDocument)
    - OR Use the HappyDocument::addForm method to manually add form(s)
  - Specify a selector to select all HappyField elements
    - OR Override HappyForm::findFieldDOMElements method (i.e. Custom HappyField/s)
    - OR Use the HappyForm::addField method to manually add form field(s)
  - Specify a selector to select all HappyInput elements
    - OR Override HappyInput/HappyInputType::findInputDOMElements method (i.e. Custom HappyInput/s)
    - OR Use the HappyForm::addField method to manually add form field(s)

3. Define and Add custom validators
  - Validators should return {False} if OK or {True|String|Array} if NOT OK.
    - @return {False} Do nothing.
    - @return {True} Add the item's default message to the item's default message anchor.
    - @return {String} Create a default message type with message.text=stringvalue and attach it to the item's
      default item anchor. The message text can be prefixed with the message's type. e.g. "danger|You have an error!".
    - @return {Array} Provide be a list of HappyMessages or HappyMessageAnchors to add. A list of anchors should each have
      their own list of HappyMessages.

4. Define and Add custom validation types
  - Types must all have methods to find, parse and assign validation information

5. Define and Add custom message anchor types
  - Types must all have methods to find, parse and assign anchor information

6. Define and Add custom message types
  - Types must all have methods to find, parse and assign message information

7. Build up a happy item hierarchy from the HTML document content (including anchors and messages)
   and set item states, values and/or initial values based on the items' HTML attributes.
  - If the HTML document suggests that some fields or inputs are unhappy, initial field and/or input values
    must also be provided somewhere to enbale the correct handling of the "modified" state on the client-side.
  - If no initial values are found, initial values will be set equal to current values.

8. Look for a saved HappyDocument state on the client-side. If found, update affected input+field values
   and keep a list of the updated items.

9. Run validations on all updated items to automaticaly update the DOM and show any changes in state.

10. Run "Bind update triggers" on all happy items.



### Check

1. GET THE VALUE: Calculate / get the current value of the item to check.
2. CHECK MODIFIED: Update "item.state.modified" if "item.noModify" is false or undefined.
3. CHECK VALID: Run all enabled validations for this item if "item.noValidate" is false or undefined.
4. BROADCAST: Re-trigger the original event e.g. 'doc1_form1_field2_input3.change', 'happy2item.blur',
   'happy2item.input' inside the happy document context to allow other subscribed happy document items
   to apply this event to their own states.



### Update DOM

1. a
2. b
3. c
4. d

-
--


Original Concept Spec...
------------------------

- Where should messages be stored?
- How can we access them to update / remove
- How can we access message anchors for a specific validation?


### HAPPY ITEM

  - ID


### HAPPY DOCUMENT

  - FORMS


### HAPPY FORM

  - FIELDS


### HAPPY FIELD

  - STORE

  - INITIAL VALUE

  - CURRENT VALUE

  - $NEXT FIELD

  - $PREV FIELD

  - INPUTS

  - VALIDATIONS

  - MESSAGE ZONES

  - MESSAGES

  - STATE               -> { VISIBLE, ENABLED, READ-ONLY, UNHAPPY, MODIFIED }


### HAPPY INPUT

  - ID

  - $ELM

  - TYPE

  - FIELD

  - STORE

  - INITIAL VALUE

  - CURRENT VALUE

  - $NEXT FIELD INPUT

  - $PREV FIELD INPUT

  - VALIDATIONS

  - MESSAGE ZONES

  - MESSAGES

  - STATE               -> { VISIBLE, ENABLED, READ-ONLY, UNHAPPY, MODIFIED }

  - FN: GET DOM ELM

  - FN: GET NEXT INPUT  -> THIS.$NEXT || FIELD.$FIRST

  - FN: GET PREV INPUT  -> THIS.$PREV || FIELD.$LAST

  - FN: GET VALUE

  - FN: SET VALUE

  - FN: READ VALUE      -> READ FROM DOM

  - FN: PARSE VALUE

  - FN: FORMAT VALUE

  - FN: RENDER VALUE

  - FN: INIT VALUE      -> SET CURRENT VALUE + SET INITIAL VALUE

  - FN: LOAD VALUE      -> MAP TO STORE + READ VALUE FROM STORE + INIT VALUE

  - FN: STORE VALUE     -> GET + MAP TO STORE + WRITE TO STORE

  - FN: UPDATE VALUE    -> READ VALUE FROM DOM + PARSE + SET + RENDER

  - FN: RESET VALUE     -> SET TO INITIAL VALUE + RENDER

  - FN: CLEAR VALUE     -> SET TO EMPTY VALUE + RENDER

  - FN: GET VALIDATIONS

  - FN: ADD VALIDATION

  - FN: VALIDATE

  - FN: UNHAPPY

  - FN: HAPPY

  - FN: CHECK MODIFIED

  - FN: ON BLUR

  - FN: ON INPUT

  - FN: ON CHANGE

  - FN: ON FOCUS

  - FN: BIND EVENTS

  - FN: RENDER STATE

  - FN: GET MESSAGE     (ID)

  - FN: ADD MESSAGE     (MSG)

  - FN: UPDATE MESSAGE  (ID,MSG)

  - FN: REMOVE MESSAGE  (ID)

  - FN: RENDER MESSAGE  (ID)

  - FN: GET MESSAGES    (ZONE)

  - FN: CLEAR MESSAGES  (ZONE)

  - FN: RENDER MESSAGES (ZONE)

  - FN: GET MESSAGE ZONES

  - FN: RENDER MESSAGE ZONES

  - FN: RENDER         -> RENDER VALUE + RENDER MESSAGES + RENDER STATE


### HAPPY MESSAGE ZONE

  - ID

  - STATE

  - $ELM

  - MESSAGES

  - FN: GET $ELM

  - FN: CLEAR

  - FN: ADD MESSAGE

  - FN: UPDATE MESSAGE

  - FN: REMOVE MESSAGE

  - FN: RENDER STATE

  - FN: RENDER MESSAGE

  - FN: RENDER


### HAPPY MESSAGE

  - ID

  - TYPE

  - STATE

  - ZONE

  - DATA

  - TEMPLATE

  - TEXT

  - $ELM
