interface KarpenterResourceManager {
  // Core resource fetching with caching
  async getNodePools(): Promise<NodePool[]>;
  async getProvisioners(): Promise<Provisioner[]>;
  async getNodeClasses(): Promise<NodeClass[]>;
  
  // Real-time updates via WebSocket
  watchResourceChanges(callback: (event: ResourceEvent) => void): void;
  
  // Health assessment
  calculateResourceHealth(resource: KarpenterCRD): HealthScore;
}

// Example: NodePool status component
const NodePoolStatus: React.FC<{nodePool: NodePool}> = ({nodePool}) => {
  const health = useResourceHealth(nodePool);
  const constraints = useConstraintAnalysis(nodePool);
  
  return (
    <Card>
      <HealthIndicator status={health.status} />
      <ConstraintVisualization constraints={constraints} />
      <NodeCapacityChart nodePool={nodePool} />
    </Card>
  );
};