export default interface Feed {
  integration_id: string;
  name: string;
  description: string;
  organisationId: number;
  spaceId: number;
  pageId: number;
  color: 'green' | 'amber' | 'red' | 'default';
  message: string;
  dependencies: number[];
  custom_data: {};
}
