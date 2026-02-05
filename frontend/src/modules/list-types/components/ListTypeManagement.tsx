/**
 * List Type Management Component
 *
 * Master-detail coordinator for managing list types and their values.
 * Admin-only interface for configuring dropdown lists.
 */

import React, { useState } from 'react';
import { ListTypesGrid } from './ListTypesGrid';
import { ListValuesGrid } from './ListValuesGrid';

export function ListTypeManagement() {
  const [selectedListTypeId, setSelectedListTypeId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">List of Values</h1>
        <p className="text-gray-600">
          Manage configurable dropdown lists used throughout the application.
        </p>
      </div>

      {/* Master Grid - List Types */}
      <div>
        <ListTypesGrid onListTypeSelect={setSelectedListTypeId} />
      </div>

      {/* Detail Grid - List Values */}
      <div>
        <ListValuesGrid listTypeId={selectedListTypeId} />
      </div>
    </div>
  );
}

export default ListTypeManagement;
