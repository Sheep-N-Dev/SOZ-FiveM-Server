import { JobType } from '@public/shared/job';
import { PolygonZone } from '@public/shared/polyzone/polygon.zone';

import { Inject, Injectable } from '../../core/decorators/injectable';
import { Zone } from '../../shared/polyzone/box.zone';
import { Ped, PedFactory } from '../factory/ped.factory';

export type TargetOptions = {
    label: string;
    icon?: string;
    color?: string;
    type?: string;
    event?: string;
    blackoutGlobal?: boolean;
    blackoutJob?: string;
    canInteract?: (entity) => boolean | Promise<boolean>;
    action?: (entity) => void;
    job?: string | JobType | Partial<{ [key in JobType]: number }>;
    item?: string;
};

export type PedOptions = Ped & {
    spawnNow?: boolean;
    length?: number;
    width?: number;
    minusOne?: boolean;
    debugPoly?: boolean;
    target: {
        options: TargetOptions[];
        distance: number;
    };
};

const DEFAULT_DISTANCE = 2.5;

@Injectable()
export class TargetFactory {
    private zones: { [id: string]: any } = {};
    private players: { [id: string]: any } = {};
    private vehicles: { [id: string]: any } = {};

    @Inject(PedFactory)
    private pedFactory: PedFactory;

    public createForBoxZone(id: string, zone: Zone<any>, targets: TargetOptions[], distance = DEFAULT_DISTANCE) {
        zone = {
            length: 1,
            width: 1,
            heading: 0,
            minZ: 0,
            maxZ: 1,
            ...zone,
        };

        exports['qb-target'].AddBoxZone(
            id,
            { x: zone.center[0], y: zone.center[1], z: zone.center[2] },
            zone.length,
            zone.width,
            {
                debugPoly: zone.debugPoly || false,
                heading: zone.heading,
                minZ: zone.minZ,
                maxZ: zone.maxZ,
                name: id,
            },
            {
                options: targets,
                distance: distance,
            }
        );

        this.zones[id] = zone;
    }

    public createForPolygoneZone(
        id: string,
        zone: PolygonZone<any>,
        targets: TargetOptions[],
        distance = DEFAULT_DISTANCE
    ) {
        exports['qb-target'].AddPolyZone(
            id,
            zone.getPoints().map(vector => ({ x: vector[0], y: vector[1] })),
            {
                debugPoly: zone.debugPoly || false,
                minZ: zone.minZ,
                maxZ: zone.maxZ,
                name: id,
            },
            {
                options: targets,
                distance: distance,
            }
        );

        this.zones[id] = zone;
    }

    public createForAllPlayer(targets: TargetOptions[], distance = DEFAULT_DISTANCE) {
        exports['qb-target'].AddGlobalPlayer({
            options: targets,
            distance: distance,
        });

        for (const target of targets) {
            this.players[target.label] = target;
        }
    }

    public unload() {
        for (const id of Object.keys(this.zones)) {
            exports['qb-target'].RemoveZone(id);
        }

        // for (const id of Object.keys(this.players)) {
        //     exports['qb-target'].RemoveGlobalPlayer(id);
        // }
        //
        // for (const id of Object.keys(this.vehicles)) {
        //     exports['qb-target'].RemoveGlobalVehicle(id);
        // }

        //exports['qb-target'].DeletePeds();
    }

    public async createForPed(ped: PedOptions) {
        const id = await this.pedFactory.createPedOnGrid(ped);

        this.createForBoxZone(
            `entity_${id}`,
            {
                center: [ped.coords.x, ped.coords.y, ped.coords.z],
                heading: ped.coords.w,
                width: ped.width || 0.8,
                length: ped.length || 0.8,
                minZ: ped.coords.z - 1,
                maxZ: ped.coords.z + 2,
                debugPoly: ped.debugPoly,
            },
            ped.target.options
        );
    }

    public createForModel(
        models: string[] | number[] | string | number,
        targets: TargetOptions[],
        distance = DEFAULT_DISTANCE
    ) {
        exports['qb-target'].AddTargetModel(models, {
            options: targets,
            distance: distance,
        });
    }

    public createForEntity(
        entities: string[] | number[] | string | number,
        targets: TargetOptions[],
        distance = DEFAULT_DISTANCE
    ) {
        exports['qb-target'].AddTargetEntity(entities, {
            options: targets,
            distance: distance,
        });
    }

    public createForAllVehicle(targets: TargetOptions[], distance = DEFAULT_DISTANCE) {
        exports['qb-target'].AddGlobalVehicle({
            options: targets,
            distance: distance,
        });

        for (const target of targets) {
            this.vehicles[target.label] = target;
        }
    }

    public createForAllPed(targets: TargetOptions[], distance = DEFAULT_DISTANCE) {
        exports['qb-target'].AddGlobalPed({
            options: targets,
            distance: distance,
        });
    }

    public removeTargetModel(models: string[], labels: string[]) {
        exports['qb-target'].RemoveTargetModel(models, labels);
    }

    public removeBoxZone(id: string) {
        exports['qb-target'].RemoveZone(id);
    }

    // // @TODO - Implement it when needed
    // public removeTargetEntity(entities: string[], labels: string[]) {}
}
