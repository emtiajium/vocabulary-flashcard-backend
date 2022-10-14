import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

export default class DatabaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    private getTableName(tableOrName: Table | string): string {
        return tableOrName instanceof Table ? tableOrName.name : tableOrName;
    }

    private joinColumns(columnNames: string[]): string {
        return columnNames.join('_');
    }

    primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
        return `PK_${this.getTableName(tableOrName)}_${this.joinColumns(columnNames)}`;
    }

    foreignKeyName(
        referencingTableOrName: Table | string,
        referencingColumnNames: string[],
        referencedTablePath?: string,
        referencedColumnNames?: string[],
    ): string {
        const referencingTableName = this.getTableName(referencingTableOrName);

        const referencingReferencedGroup = referencingColumnNames.map((referencingColumn, index) => {
            return `${referencingTableName}_${referencingColumn}_${referencedTablePath}_${referencedColumnNames[index]}`;
        });

        return `FK_${referencingReferencedGroup.join('_')}`;
    }

    indexName(tableOrName: Table | string, columnNames: string[] /* , where?: string */): string {
        // TODO think about the naming strategy with the WHERE clause
        return `IDX_${this.getTableName(tableOrName)}_${this.joinColumns(columnNames)}`;
    }

    uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
        return `UQ_${this.getTableName(tableOrName)}_${this.joinColumns(columnNames)}`;
    }
}
