import {field, component, Type, World, Entity} from '../src';

class Stuff {
  value: number;
}

@component class Big {
  @field(Type.boolean) boolean: boolean;
  @field(Type.uint8) uint8: number;
  @field(Type.int8) int8: number;
  @field(Type.uint16) uint16: number;
  @field(Type.int16) int16: number;
  @field(Type.uint32) uint32: number;
  @field(Type.int32) int32: number;
  @field(Type.float32) float32: number;
  @field(Type.float64) float64: number;
  @field(Type.staticString(['foo', 'bar', 'baz'])) staticString: string;
  @field(Type.dynamicString(14)) dynamicString: string;
  @field(Type.ref) ref?: Entity;
  @field(Type.object) object: Stuff;
  @field(Type.weakObject) weakObject: Stuff;
}

async function testReadWrite(prop: string, values: any[]): Promise<void> {
  const world = await World.create({defs: [Big]});
  world.build(system => {
    const entity = system.createEntity(Big);
    for (const value of values) {
      (entity.write(Big) as any)[prop] = value;
      expect((entity.read(Big) as any)[prop]).toBe(value);
    }
  });
}


describe('getting and setting fields of various types', () => {

  test('boolean', async() => {
    await testReadWrite('boolean', [false, true]);
  });

  test('uint8', async() => {
    await testReadWrite('uint8', [0, 127, 255]);
  });

  test('int8', async() => {
    await testReadWrite('int8', [0, 127, -128]);
  });

  test('uint16', async() => {
    await testReadWrite('uint16', [0, 2 ** 15 - 1, 2 ** 16 - 1]);
  });

  test('int16', async() => {
    await testReadWrite('int16', [0, 2 ** 15 - 1, -(2 ** 15)]);
  });

  test('uint32', async() => {
    await testReadWrite('uint32', [0, 2 ** 31 - 1, 2 ** 32 - 1]);
  });

  test('int32', async() => {
    await testReadWrite('int32', [0, 2 ** 31 - 1, -(2 ** 31)]);
  });

  test('float32', async() => {
    await testReadWrite('float32', [0, 2 ** 24, -(2 ** 24), 0.5, -0.5]);
  });

  test('float64', async() => {
    await testReadWrite('float64', [0, 2 ** 53, -(2 ** 53), 0.5, -0.5]);
  });

  test('staticString', async() => {
    await testReadWrite('staticString', ['foo', 'bar', 'baz']);
  });

  test('dynamicString', async() => {
    await testReadWrite('dynamicString', ['', 'foo', 'foobarbazqux12', '🤷‍♂️']);
  });

  test('ref', async() => {
    const world = await World.create({defs: [Big]});
    world.build(system => {
      const a = system.createEntity(Big);
      const b = system.createEntity(Big);
      a.write(Big).ref = b;
      expect(a.read(Big).ref).toBe(b);
      a.write(Big).ref = undefined;
      expect(a.read(Big).ref).toBe(undefined);
    });
  });

  test('object', async() => {
    const stuff = new Stuff();
    await testReadWrite('object', [undefined, null, stuff]);
  });

  test('weakObject', async() => {
    const stuff = new Stuff();
    await testReadWrite('weakObject', [undefined, null, stuff]);
  });

  // Can't figure out how to force garbage collection to test this, even after following
  // https://stackoverflow.com/questions/65175380.
  test.skip('weakObject garbage collection', async() => {
    const a: any[] = [new Stuff()];
    const world = await World.create({defs: [Big]});
    let entity: Entity;  // this will get released, but nothing will overwrite it
    world.build(system => {
      entity = system.createEntity(Big);
      entity.write(Big).weakObject = a[0];
      expect(entity.read(Big).weakObject).toBe(a[0]);
    });
    delete a[0];
    eval('%CollectGarbage(true)');  // eslint-disable-line no-eval
    expect(entity!.read(Big).weakObject).toBe(undefined);
  });

});

