import {
  Static,
  TSchema,
  Type,
} from "https://raw.githubusercontent.com/shopstic/typebox/0.10.1/src/typebox.ts";

export function createWatchEventSchema<S extends TSchema>(object: S) {
  return Type.Object({
    type: Type.Union([
      Type.Literal("ADDED"),
      Type.Literal("MODIFIED"),
      Type.Literal("DELETED"),
    ]),
    object: object,
  });
}

export const PatchOperationSchema = Type.Union([
  Type.Object({
    path: Type.String(),
    op: Type.Literal("add"),
    value: Type.Any(),
  }),
  Type.Object({
    path: Type.String(),
    op: Type.Literal("remove"),
  }),
  Type.Object({
    path: Type.String(),
    op: Type.Literal("replace"),
    value: Type.Any(),
  }),
  Type.Object({
    path: Type.String(),
    op: Type.Literal("move"),
    from: Type.String(),
  }),
  Type.Object({
    path: Type.String(),
    op: Type.Literal("copy"),
    from: Type.String(),
  }),
  Type.Object({
    path: Type.String(),
    op: Type.Literal("test"),
    value: Type.Any(),
  }),
  Type.Object({
    path: Type.String(),
    op: Type.Literal("render"),
    template: Type.String(),
    replace: Type.Boolean(),
    open: Type.Optional(Type.String()),
    close: Type.Optional(Type.String()),
  }),
]);

export type PatchOperation = Static<typeof PatchOperationSchema>;

export const ReplicatedResourceSpecSchema = Type.Object({
  kind: Type.String(),
  fromNamespace: Type.String(),
  fromName: Type.String(),
  toName: Type.String(),
  patches: Type.Optional(Type.Array(PatchOperationSchema)),
});

export const GenericResourceWatchEventSchema = createWatchEventSchema(
  Type.Object({
    apiVersion: Type.String(),
    kind: Type.String(),
    metadata: Type.Object({
      name: Type.String(),
      namespace: Type.Optional(Type.String()),
      labels: Type.Optional(Type.Map(Type.String())),
      annotations: Type.Optional(Type.Union(
        [Type.Map(Type.String()), Type.Null()],
      )),
    }),
  }),
);

export const ReplicatedResourceSchema = Type.Object({
  apiVersion: Type.Literal("shopstic.com/v1"),
  kind: Type.Literal("ReplicatedResource"),
  metadata: Type.Object({
    name: Type.String(),
    namespace: Type.String(),
    labels: Type.Optional(Type.Map(Type.String())),
    annotations: Type.Optional(Type.Union(
      [Type.Map(Type.String()), Type.Null()],
    )),
    uid: Type.String(),
  }),
  spec: ReplicatedResourceSpecSchema,
});

export const ReplicatedResourceWatchEventSchema = createWatchEventSchema(
  ReplicatedResourceSchema,
);
