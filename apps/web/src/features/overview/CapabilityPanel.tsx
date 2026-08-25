import type { DeviceCapability } from "@modcell/contracts";
import { Check, Minus, X } from "lucide-react";
import { Panel } from "../../components/ui/Panel";

function CapabilityIcon({ availability }: Pick<DeviceCapability, "availability">) {
  if (availability === "available") return <Check size={15} strokeWidth={1.7} />;
  if (availability === "limited") return <Minus size={15} strokeWidth={1.7} />;
  return <X size={15} strokeWidth={1.7} />;
}

export function CapabilityPanel({ capabilities }: { capabilities: DeviceCapability[] }) {
  return (
    <Panel eyebrow="Capability scan" title="Device access">
      <div className="capability-list">
        {capabilities.map((capability) => (
          <div className="capability-row" key={capability.id}>
            <span className={`capability-state is-${capability.availability}`}>
              <CapabilityIcon availability={capability.availability} />
            </span>
            <div>
              <strong>{capability.label}</strong>
              <small>{capability.detail ?? capability.availability}</small>
            </div>
            <span className="capability-value">{capability.availability}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
