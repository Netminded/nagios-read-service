import { ServiceExposureMap } from './service';
import { HostExposures } from './host';

export type ExposureMap = {
  service_map: ServiceExposureMap;
  host_map: HostExposures;
};
