import { services } from '../../data/services'

export function DashboardServicesPage() {
  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Services</h1>
          <p className="text-sm text-[#6B7280] mt-1">{services.length} service offerings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
        {services.map(service => (
          <div key={service.id} className="px-5 py-4 hover:bg-[#FDFCFB] transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26]">{service.name}</p>
                <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{service.description}</p>
                {service.price && (
                  <p className="text-xs text-[#C86A43] font-medium mt-1.5">{service.price} {service.priceType ? `/ ${service.priceType}` : ''}</p>
                )}
              </div>
              <a
                href={service.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43]/50 hover:text-[#C86A43] transition-colors"
              >
                {service.ctaLabel} ↗
              </a>
            </div>
            {service.topicIds.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {service.topicIds.slice(0, 4).map(tid => (
                  <span key={tid} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{tid.replace(/-/g, ' ')}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
