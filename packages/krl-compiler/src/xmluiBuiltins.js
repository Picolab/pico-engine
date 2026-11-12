// Built-in XMLUI component names (0.14.28). XMLUI requests
// components/<Name>.xmlui for every tag it renders, so a pico component
// file with one of these names would replace the built-in.
var NAMES = [
  'APICall', 'App', 'AppHeader', 'AppState', 'AutoComplete', 'Avatar',
  'Badge', 'Bookmark', 'Button', 'CHStack', 'CVStack', 'Card',
  'ChangeListener', 'Checkbox', 'ColorPicker', 'Column', 'Component',
  'ContentSeparator', 'ContextMenu', 'DataSource', 'DateInput', 'DatePicker',
  'Drawer', 'DropdownMenu', 'ExpandableItem', 'Fallback', 'FileInput',
  'FileUploadDropZone', 'FlowLayout', 'FocusScope', 'Footer', 'Form',
  'FormItem', 'FormSegment', 'Fragment', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HSplitter', 'HStack', 'Heading', 'I18n', 'IFrame', 'Icon', 'Image',
  'IncludeMarkup', 'Inspector', 'Items', 'Link', 'List', 'LiveRegion',
  'Locale', 'Logo', 'Markdown', 'MediaPlayer', 'MenuItem', 'MenuSeparator',
  'MessageListener', 'ModalDialog', 'NavGroup', 'NavLink', 'NavPanel',
  'NavPanelCollapseButton', 'NoResult', 'NumberBox', 'Option', 'Page',
  'PageMetaTitle', 'Pages', 'Pagination', 'PasswordInput', 'PointerLayer',
  'ProgressBar', 'QRCode', 'Queue', 'RadioGroup', 'Redirect',
  'ResponsiveBar', 'ScrollViewer', 'Select', 'SkipLink', 'Slider', 'Slot',
  'SpaceFiller', 'Spinner', 'Splitter', 'Stack', 'Step', 'Stepper',
  'StickyBox', 'StickySection', 'SubMenuItem', 'Switch', 'TabItem', 'Table',
  'TableOfContents', 'Tabs', 'Text', 'TextArea', 'TextBox', 'TextNode',
  'Theme', 'TileGrid', 'TimeInput', 'Timer', 'ToneChangerButton',
  'ToneSwitch', 'Tooltip', 'Tree', 'VSplitter', 'VStack', 'Value'
]

var SET = new Set(NAMES)

/** Function name → XMLUI component name: first letter capitalized. */
function componentNameFor (fnName) {
  if (!fnName) return fnName
  return fnName.charAt(0).toUpperCase() + fnName.slice(1)
}

module.exports = {
  names: NAMES,
  isBuiltin: function (name) { return SET.has(name) },
  componentNameFor: componentNameFor
}
