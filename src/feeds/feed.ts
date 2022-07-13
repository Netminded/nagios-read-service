export default interface Feed {
  integration_id: string;
  name: string;
  description: string;
  organisationId: number;
  spaceId: number;
  pageId: number;
  dependencies: number[];
  custom_data: {};
}
