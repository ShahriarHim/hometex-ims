import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axiosInstance';

const get = (path) => api.get(path).then((r) => r.data);

function useLocDivisions() {
  return useQuery({ queryKey: ['loc', 'divisions'], queryFn: () => get('/division'), staleTime: Infinity });
}
function useLocDistricts(divId) {
  return useQuery({
    queryKey: ['loc', 'districts', divId],
    queryFn: () => get(`/districts/${divId}`),
    enabled: Boolean(divId),
    staleTime: Infinity,
  });
}
function useLocAreas(distId) {
  return useQuery({
    queryKey: ['loc', 'areas', distId],
    queryFn: () => get(`/area/${distId}`),
    enabled: Boolean(distId),
    staleTime: Infinity,
  });
}

/**
 * Cascading Division → District → Area selects.
 * Props:
 *   value       = { division_id, district_id, area_id }
 *   onChange    = (field, value) => void
 *   required    = bool (default false)
 *
 * API returns legacy keys: division_id/division_name, district_id/district_name, area_id/area_name.
 */
export default function LocationSelect({ value = {}, onChange, required = false }) {
  const { division_id, district_id, area_id } = value;

  const { data: divisions = [] } = useLocDivisions();
  const { data: districts = [] } = useLocDistricts(division_id);
  const { data: areas     = [] } = useLocAreas(district_id);

  const divList  = Array.isArray(divisions) ? divisions : divisions?.data ?? [];
  const distList = Array.isArray(districts) ? districts : districts?.data ?? [];
  const areaList = Array.isArray(areas)     ? areas     : areas?.data     ?? [];

  useEffect(() => {
    if (division_id && distList.length > 0 && !distList.some((d) => String(d.district_id) === String(district_id))) {
      onChange('district_id', '');
      onChange('area_id', '');
    }
  }, [division_id, distList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (district_id && areaList.length > 0 && !areaList.some((a) => String(a.area_id) === String(area_id))) {
      onChange('area_id', '');
    }
  }, [district_id, areaList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label">Division</label>
        <select
          className="form-select"
          value={division_id ?? ''}
          onChange={(e) => { onChange('division_id', e.target.value); }}
          required={required}
        >
          <option value="">Select division</option>
          {divList.map((d) => (
            <option key={d.division_id} value={d.division_id}>{d.division_name}</option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label className="form-label">District</label>
        <select
          className="form-select"
          value={district_id ?? ''}
          onChange={(e) => { onChange('district_id', e.target.value); }}
          disabled={!division_id}
        >
          <option value="">Select district</option>
          {distList.map((d) => (
            <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label className="form-label">Area</label>
        <select
          className="form-select"
          value={area_id ?? ''}
          onChange={(e) => { onChange('area_id', e.target.value); }}
          disabled={!district_id}
        >
          <option value="">Select area</option>
          {areaList.map((a) => (
            <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
