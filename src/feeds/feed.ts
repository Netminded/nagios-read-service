export default interface Feed {
  integration_id: string;
  api_key_name: string;
  name: string;
  description: string;
  organisationId: number;
  spaceId: number;
  pageId: number;
  dependencies: string[];
  custom_data: {
    tags?: string[];
  };
}
