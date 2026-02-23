'use client';

// ─────────────────────────────────────────────────────────────
// LockPoint — Organizational Hierarchy Tree
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { cn } from '@/shared/utils/cn';
import type { OrgNode } from '@/features/hierarchy/types';

interface OrgTreeProps {
    nodes: OrgNode[];
    onSelectNode?: (node: OrgNode) => void;
    selectedId?: string;
}

export function OrgTree({ nodes, onSelectNode, selectedId }: OrgTreeProps) {
    return (
        <div className="space-y-1">
            {nodes.map((node) => (
                <OrgTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onSelect={onSelectNode}
                    selectedId={selectedId}
                />
            ))}
        </div>
    );
}

function OrgTreeNode({
    node,
    depth,
    onSelect,
    selectedId,
}: {
    node: OrgNode;
    depth: number;
    onSelect?: (node: OrgNode) => void;
    selectedId?: string;
}) {
    const [expanded, setExpanded] = useState(depth < 2);
    const hasChildren = (node.children || []).length > 0;
    const isSelected = node.id === selectedId;

    const stats = node.stats;
    const inBasePercent = stats && stats.totalPersonnel > 0
        ? Math.round((stats.inBase / stats.totalPersonnel) * 100)
        : null;

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm',
                    isSelected
                        ? 'bg-signal-green/10 text-signal-green border border-signal-green/20'
                        : 'hover:bg-slate-dark text-text-secondary hover:text-text-primary'
                )}
                style={{ paddingLeft: `${depth * 20 + 12}px` }}
                onClick={() => {
                    if (hasChildren) setExpanded(!expanded);
                    onSelect?.(node);
                }}
            >
                {/* Expand/collapse */}
                <span className={cn(
                    'text-[10px] w-4 text-center transition-transform flex-shrink-0',
                    expanded && 'rotate-90'
                )}>
                    {hasChildren ? '▶' : '·'}
                </span>

                {/* Type badge */}
                <span className="text-[10px] uppercase tracking-widest text-text-muted w-8 flex-shrink-0">
                    {node.type.slice(0, 3)}
                </span>

                {/* Name */}
                <span className="font-medium truncate">{node.name}</span>

                {/* Stats */}
                {stats && (
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                        <span className="data-mono text-xs text-text-muted">
                            {stats.totalPersonnel}
                        </span>

                        {inBasePercent !== null && (
                            <div className="w-16 h-1.5 rounded-full bg-slate-dark overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        inBasePercent >= 80 ? 'bg-signal-green' :
                                            inBasePercent >= 50 ? 'bg-warning-amber' : 'bg-danger-red'
                                    )}
                                    style={{ width: `${inBasePercent}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Children */}
            {expanded && hasChildren && (
                <div>
                    {(node.children || []).map((child) => (
                        <OrgTreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
