var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
let Leader = class Leader {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Leader.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Leader.prototype, "name", void 0);
__decorate([
    Column('date'),
    __metadata("design:type", Date)
], Leader.prototype, "startDate", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], Leader.prototype, "age", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Leader.prototype, "city", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Leader.prototype, "coffeeShop", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Leader.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Leader.prototype, "updatedAt", void 0);
Leader = __decorate([
    Entity()
], Leader);
export { Leader };
