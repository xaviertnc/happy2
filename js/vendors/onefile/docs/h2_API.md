HAPPY FIELD OBJECT API
======================

  getElement			  // Code to fetch the HTML / DOM element for this field object
  getParentElement  // Code to fetch the HTML / DOM element parent of this field object.

  getId             // Field element id.
  getName           // Human readable name (possibly also main input name)
  getType           // Text, memo, select, file, etc.
  getState          // Enabled + visible + readonly + noValidate.
  getValidations    // List of validation objects taken from field html or obj-config.
  getMessageAnchors // List of anchor objects and elements taken from the fields html or obj-config.
  getMessages       // List of message objects and elements taken from field html or obj-config.
  getInputs         // List of input objects taken from field html.
  getValue          // A single input value or an aggregate of multiple input values.

  firstUnhappyInput

  updateParent      // Trigger parent "update child status event" or set parent props directly.

  addMessage			  // Add a message object to the messages list.
  removeMessage     // Remove a message object from the messages list.
  updateMessage     // Update a message object in the messages list.

  addMessageAnchor  // Add a message anchor object to the messages list.

  updateElm         // Modify/update all dynamic parts of the field html element.
  renderElm         // Create a completely new field html element.

  init						  // Import any user config + Parse the field HTML element if it exists + Bind events.
  mount						  // Append the field HTML element to the docuent if it doesn't exist. (Like after render)
  validate          // Get the current value and state of the field + Run all validations + Update messages
  testModified      // Get current value/s + compare to initial value/s
  update					  // validate + testModified + Update local state, parent state + Update DOM

  onUpdate          // Triggered by user interaction events
  onSubmit          // Triggered when the user submits the form linked to this field.

  bindOnBlur        // Event binding code (e.g. Trigger onUpdate)
  bindOnFocus       // Event binding code
  bindOnChange      // Event binding code
  bindOnInput       // Event binding code
  bindOnSubmit		  // Event binding code

  elm							  // The field HTML / DOM element

  props
    - id
    - name
    - type
    - visible
    - enabled
    - readonly
    - selector
    - noValidate
    - validations
    - initialValue
    - localStoreName
    - submitElement

  data
    - happy
    - parent
    - unhappy
    - modified
    - messagesAnchors
    - messages
    - inputs
    - value
    - prevField			// To easily find the next field element to focus on for instance.
    - nextfield



HAPPY INPUT OBJECT API
=======================

  updateParent      // Trigger parent "update child status event" or set parent props directly.

  addMessage			  // Add a message object to the messages list.
  removeMessage     // Remove a message object from the messages list.
  updateMessage     // Update a message object in the messages list.

  addMessageAnchor  // Add a message anchor object to the messages list.

  updateElm         // Modify/update all dynamic parts of the field html element.
  renderElm         // Create a completely new field html element.

  init						  // Import any user config + Parse the field HTML element if it exists + Bind events.
  mount						  // Append the field HTML element to the docuent if it doesn't exist. (Like after render)
  validate          // Get the current value and state of the field + Run all validations + Update messages
  testModified      // Get current value/s + compare to initial value/s
  update					  // validate + testModified + Update local state, parent state + Update DOM

  onUpdate          // Triggered by user interaction events
  onSubmit          // Triggered when the user submits the form linked to this field.

  bindOnBlur        // Event binding code (e.g. Trigger onUpdate)
  bindOnFocus       // Event binding code
  bindOnChange      // Event binding code
  bindOnInput       // Event binding code
  bindOnSubmit		  // Event binding code

  props
    - enabled
    - readonly
    - selector
    - noValidate
    - validations
    - initialValue

  data
    - happy
    - unhappy
    - modified
	  - messageAnchors
	  - messages
		- value



HAPPY MESSAGE OBJECT API
========================

  parseMessageElm     // Get the initial values for a new message object from the field html.
  updateMessageElm    // Update a message object's html element with its latest values.
  renderMessageElm    // Create a new html message element based on some message object.
  setAnchorElement
  setRelationToAnchor



HAPPY VALIDATOR OBJECT API
===========================
  renderMessage