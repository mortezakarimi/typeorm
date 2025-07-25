import { Subject } from "./Subject"
import { EntityMetadata } from "../metadata/EntityMetadata"
import { TypeORMError } from "../error"

/**
 * Orders insert or remove subjects in proper order (using topological sorting)
 * to make sure insert or remove operations are executed in a proper order.
 */
export class SubjectTopologicalSorter {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Insert subjects needs to be sorted.
     */
    subjects: Subject[]

    /**
     * Unique list of entity metadatas of this subject.
     */
    metadatas: EntityMetadata[]

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(subjects: Subject[]) {
        this.subjects = [...subjects] // copy subjects to prevent changing of sent array
        this.metadatas = this.getUniqueMetadatas(this.subjects)
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sorts (orders) subjects in their topological order.
     */
    sort(direction: "insert" | "delete"): Subject[] {
        // if there are no metadatas it probably mean there is no subjects... we don't have to do anything here
        if (!this.metadatas.length) return this.subjects

        const sortedSubjects: Subject[] = []

        // first if we sort for deletion all junction subjects
        // junction subjects are subjects without entity and database entity set
        if (direction === "delete") {
            const junctionSubjects = this.subjects.filter(
                (subject) => !subject.entity && !subject.databaseEntity,
            )
            sortedSubjects.push(...junctionSubjects)
            this.removeAlreadySorted(junctionSubjects)
        }

        // next we always insert entities with non-nullable relations, sort them first
        const nonNullableDependencies = this.getNonNullableDependencies()
        let sortedNonNullableEntityTargets = this.toposort(
            nonNullableDependencies,
        )
        if (direction === "insert")
            sortedNonNullableEntityTargets =
                sortedNonNullableEntityTargets.reverse()

        // so we have a sorted entity targets
        // go thought each of them and find all subjects with sorted entity target
        // add those sorted targets and remove them from original array of targets
        sortedNonNullableEntityTargets.forEach((sortedEntityTarget) => {
            const entityTargetSubjects = this.subjects.filter(
                (subject) =>
                    subject.metadata.targetName === sortedEntityTarget ||
                    subject.metadata.inheritanceTree.some(
                        (s) => s.name === sortedEntityTarget,
                    ),
            )
            sortedSubjects.push(...entityTargetSubjects)
            this.removeAlreadySorted(entityTargetSubjects)
        })

        // next sort all other entities
        // same process as in above but with other entities
        const otherDependencies: string[][] = this.getDependencies()
        let sortedOtherEntityTargets = this.toposort(otherDependencies)
        if (direction === "insert")
            sortedOtherEntityTargets = sortedOtherEntityTargets.reverse()

        sortedOtherEntityTargets.forEach((sortedEntityTarget) => {
            const entityTargetSubjects = this.subjects.filter(
                (subject) => subject.metadata.targetName === sortedEntityTarget,
            )
            sortedSubjects.push(...entityTargetSubjects)
            this.removeAlreadySorted(entityTargetSubjects)
        })

        // if we have something left in the subjects add them as well
        sortedSubjects.push(...this.subjects)
        return sortedSubjects
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Removes already sorted subjects from this.subjects list of subjects.
     */
    protected removeAlreadySorted(subjects: Subject[]) {
        subjects.forEach((subject) => {
            this.subjects.splice(this.subjects.indexOf(subject), 1)
        })
    }

    /**
     * Extracts all unique metadatas from the given subjects.
     */
    protected getUniqueMetadatas(subjects: Subject[]) {
        const metadatas: EntityMetadata[] = []
        subjects.forEach((subject) => {
            if (metadatas.indexOf(subject.metadata) === -1)
                metadatas.push(subject.metadata)
        })
        return metadatas
    }

    /**
     * Gets dependency tree for all entity metadatas with non-nullable relations.
     * We need to execute insertions first for entities which non-nullable relations.
     */
    protected getNonNullableDependencies(): string[][] {
        return this.metadatas.reduce((dependencies, metadata) => {
            metadata.relationsWithJoinColumns.forEach((relation) => {
                if (relation.isNullable) return

                dependencies.push([
                    metadata.targetName,
                    relation.inverseEntityMetadata.targetName,
                ])
            })
            return dependencies
        }, [] as string[][])
    }

    /**
     * Gets dependency tree for all entity metadatas with non-nullable relations.
     * We need to execute insertions first for entities which non-nullable relations.
     */
    protected getDependencies(): string[][] {
        return this.metadatas.reduce((dependencies, metadata) => {
            metadata.relationsWithJoinColumns.forEach((relation) => {
                // if relation is self-referenced we skip it
                if (relation.inverseEntityMetadata === metadata) return

                dependencies.push([
                    metadata.targetName,
                    relation.inverseEntityMetadata.targetName,
                ])
            })
            return dependencies
        }, [] as string[][])
    }

    /**
     * Sorts given graph using topological sorting algorithm.
     *
     * Algorithm is kindly taken from https://github.com/marcelklehr/toposort repository.
     */
    protected toposort(edges: any[][]) {
        function uniqueNodes(arr: any[]) {
            const res = []
            for (let i = 0, len = arr.length; i < len; i++) {
                const edge: any = arr[i]
                if (res.indexOf(edge[0]) < 0) res.push(edge[0])
                if (res.indexOf(edge[1]) < 0) res.push(edge[1])
            }
            return res
        }

        const nodes = uniqueNodes(edges)
        let cursor = nodes.length,
            i = cursor
        const sorted = new Array(cursor),
            visited = new Set<number>()

        while (i--) {
            if (!visited.has(i)) visit(nodes[i], i, [])
        }

        function visit(node: any, i: number, predecessors: any[]) {
            if (predecessors.indexOf(node) >= 0) {
                throw new TypeORMError(
                    "Cyclic dependency: " + JSON.stringify(node),
                ) // todo: better error
            }

            if (!~nodes.indexOf(node)) {
                throw new TypeORMError(
                    "Found unknown node. Make sure to provided all involved nodes. Unknown node: " +
                        JSON.stringify(node),
                )
            }

            if (visited.has(i)) return
            visited.add(i)

            // outgoing edges
            const outgoing = edges.filter(function (edge) {
                return edge[0] === node
            })
            if ((i = outgoing.length)) {
                const preds = predecessors.concat(node)
                do {
                    const child = outgoing[--i][1]
                    visit(child, nodes.indexOf(child), preds)
                } while (i)
            }

            sorted[--cursor] = node
        }

        return sorted
    }
}
