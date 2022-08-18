const { extract_tags_from_custom_variables } = require('../dist/utils/tags');

test('nagios object tag extraction successfully extracts _NMTAG_', () => {
  const custom_variables = {
    foo: 'Bar',
    _NMTAG_MY_TAG: 'my tag',
    _NMTAG__NMTAG_TAG_2: 'Tag 2',
  };
  const tags = extract_tags_from_custom_variables(custom_variables);
  expect(tags).toEqual({
    MY_TAG: 'my tag',
    _NMTAG_TAG_2: 'Tag 2',
  });
});
