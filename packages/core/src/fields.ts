import type { FieldKind, FieldMeta, ValidationConstraint } from './meta.js'

export interface FieldFlags {
  nullable: boolean
  optional: boolean
  hasDefault: boolean
  autoIncrement: boolean
  primary: boolean
  unique: boolean
  updatable: boolean
  hidden: boolean
  internal: boolean
}

export type DefaultFieldFlags = {
  nullable: false
  optional: false
  hasDefault: false
  autoIncrement: false
  primary: false
  unique: false
  updatable: true
  hidden: false
  internal: false
}

export type DefaultIdFlags = {
  nullable: false
  optional: true
  hasDefault: true
  autoIncrement: true
  primary: true
  unique: false
  updatable: false
  hidden: false
  internal: false
}

type MergeFlags<T extends FieldFlags, U extends Partial<FieldFlags>> = Omit<T, keyof U> & U

type NormalizeValue<TValue, TFlags extends FieldFlags> =
  TFlags['nullable'] extends true ? TValue | null : TValue

const defaultFlags: DefaultFieldFlags = {
  nullable: false,
  optional: false,
  hasDefault: false,
  autoIncrement: false,
  primary: false,
  unique: false,
  updatable: true,
  hidden: false,
  internal: false,
}

export interface FieldBuilder<
  TValue,
  TKind extends FieldKind,
  TFlags extends FieldFlags = FieldFlags,
> {
  readonly __fieldBrand: {
    value: TValue
    kind: TKind
    flags: TFlags
  }
  nullable(): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { nullable: true }>>
  optional(): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { optional: true }>>
  unique(): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { unique: true }>>
  primary(): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { primary: true; updatable: false }>>
  hidden(): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { hidden: true }>>
  internal(): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { internal: true }>>
  auto(): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { autoIncrement: true; hasDefault: true; optional: true; updatable: false }>>
  default(value: NormalizeValue<TValue, TFlags>): FieldBuilder<TValue, TKind, MergeFlags<TFlags, { hasDefault: true; optional: true }>>
  getMeta(): FieldMeta
}

class BaseFieldBuilder<
  TValue,
  TKind extends FieldKind,
  TFlags extends FieldFlags,
> implements FieldBuilder<TValue, TKind, TFlags>
{
  declare readonly __fieldBrand: {
    value: TValue
    kind: TKind
    flags: TFlags
  }

  constructor(
    protected readonly kind: TKind,
    protected readonly flags: FieldFlags,
    protected readonly validations: ValidationConstraint[],
    protected readonly defaultValue?: unknown,
  ) {}

  protected next<TNextFlags extends FieldFlags>(
    flags: TNextFlags,
    validations: ValidationConstraint[] = this.validations,
    defaultValue: unknown = this.defaultValue,
  ): BaseFieldBuilder<TValue, TKind, TNextFlags> {
    const Ctor = this.constructor as new (
      kind: TKind,
      flags: FieldFlags,
      validations: ValidationConstraint[],
      defaultValue?: unknown,
    ) => BaseFieldBuilder<TValue, TKind, TNextFlags>

    return new Ctor(
      this.kind,
      flags,
      validations,
      defaultValue,
    )
  }

  nullable(): BaseFieldBuilder<
    TValue,
    TKind,
    MergeFlags<TFlags, { nullable: true }>
  > {
    return this.next({ ...this.flags, nullable: true } as MergeFlags<TFlags, { nullable: true }>)
  }

  optional(): BaseFieldBuilder<
    TValue,
    TKind,
    MergeFlags<TFlags, { optional: true }>
  > {
    return this.next({ ...this.flags, optional: true } as MergeFlags<TFlags, { optional: true }>)
  }

  unique(): BaseFieldBuilder<TValue, TKind, MergeFlags<TFlags, { unique: true }>> {
    return this.next({ ...this.flags, unique: true } as MergeFlags<TFlags, { unique: true }>)
  }

  primary(): BaseFieldBuilder<
    TValue,
    TKind,
    MergeFlags<TFlags, { primary: true; updatable: false }>
  > {
    return this.next({ ...this.flags, primary: true, updatable: false } as MergeFlags<TFlags, { primary: true; updatable: false }>)
  }

  hidden(): BaseFieldBuilder<TValue, TKind, MergeFlags<TFlags, { hidden: true }>> {
    return this.next({ ...this.flags, hidden: true } as MergeFlags<TFlags, { hidden: true }>)
  }

  internal(): BaseFieldBuilder<TValue, TKind, MergeFlags<TFlags, { internal: true }>> {
    return this.next({ ...this.flags, internal: true } as MergeFlags<TFlags, { internal: true }>)
  }

  auto(): BaseFieldBuilder<
    TValue,
    TKind,
    MergeFlags<
      TFlags,
      { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
    >
  > {
    return this.next(
      {
        ...this.flags,
        autoIncrement: true,
        hasDefault: true,
        optional: true,
        updatable: false,
      } as MergeFlags<
        TFlags,
        { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
      >,
    )
  }

  default(
    value: NormalizeValue<TValue, TFlags>,
  ): BaseFieldBuilder<
    TValue,
    TKind,
    MergeFlags<TFlags, { hasDefault: true; optional: true }>
  > {
    return this.next(
      { ...this.flags, hasDefault: true, optional: true } as MergeFlags<
        TFlags,
        { hasDefault: true; optional: true }
      >,
      this.validations,
      value,
    )
  }

  protected withValidation(
    validation: ValidationConstraint,
  ): BaseFieldBuilder<TValue, TKind, TFlags> {
    return this.next(this.flags as TFlags, [...this.validations, validation])
  }

  getMeta(): FieldMeta {
    return {
      kind: this.kind,
      nullable: this.flags.nullable,
      optional: this.flags.optional,
      unique: this.flags.unique,
      primary: this.flags.primary,
      defaultValue: this.defaultValue,
      autoIncrement: this.flags.autoIncrement,
      updatable: this.flags.updatable,
      hidden: this.flags.hidden,
      internal: this.flags.internal,
      validations: [...this.validations],
    }
  }
}

type StringFlags = FieldFlags

class StringFieldBuilder<
  TFlags extends StringFlags,
> extends BaseFieldBuilder<string, 'string', TFlags> {
  nullable(): StringFieldBuilder<MergeFlags<TFlags, { nullable: true }>> {
    return super.nullable() as unknown as StringFieldBuilder<MergeFlags<TFlags, { nullable: true }>>
  }

  optional(): StringFieldBuilder<MergeFlags<TFlags, { optional: true }>> {
    return super.optional() as unknown as StringFieldBuilder<MergeFlags<TFlags, { optional: true }>>
  }

  unique(): StringFieldBuilder<MergeFlags<TFlags, { unique: true }>> {
    return super.unique() as unknown as StringFieldBuilder<MergeFlags<TFlags, { unique: true }>>
  }

  primary(): StringFieldBuilder<MergeFlags<TFlags, { primary: true; updatable: false }>> {
    return super.primary() as unknown as StringFieldBuilder<
      MergeFlags<TFlags, { primary: true; updatable: false }>
    >
  }

  hidden(): StringFieldBuilder<MergeFlags<TFlags, { hidden: true }>> {
    return super.hidden() as unknown as StringFieldBuilder<MergeFlags<TFlags, { hidden: true }>>
  }

  internal(): StringFieldBuilder<MergeFlags<TFlags, { internal: true }>> {
    return super.internal() as unknown as StringFieldBuilder<MergeFlags<TFlags, { internal: true }>>
  }

  auto(): StringFieldBuilder<
    MergeFlags<
      TFlags,
      { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
    >
  > {
    return super.auto() as unknown as StringFieldBuilder<
      MergeFlags<
        TFlags,
        { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
      >
    >
  }

  default(
    value: NormalizeValue<string, TFlags>,
  ): StringFieldBuilder<MergeFlags<TFlags, { hasDefault: true; optional: true }>> {
    return super.default(value) as unknown as StringFieldBuilder<
      MergeFlags<TFlags, { hasDefault: true; optional: true }>
    >
  }

  email(): StringFieldBuilder<TFlags> {
    return this.withValidation({ kind: 'email' }) as StringFieldBuilder<TFlags>
  }

  min(value: number): StringFieldBuilder<TFlags> {
    return this.withValidation({ kind: 'min', value }) as StringFieldBuilder<TFlags>
  }

  max(value: number): StringFieldBuilder<TFlags> {
    return this.withValidation({ kind: 'max', value }) as StringFieldBuilder<TFlags>
  }
}

class IntFieldBuilder<TFlags extends FieldFlags> extends BaseFieldBuilder<number, 'int', TFlags> {
  nullable(): IntFieldBuilder<MergeFlags<TFlags, { nullable: true }>> {
    return super.nullable() as unknown as IntFieldBuilder<MergeFlags<TFlags, { nullable: true }>>
  }

  optional(): IntFieldBuilder<MergeFlags<TFlags, { optional: true }>> {
    return super.optional() as unknown as IntFieldBuilder<MergeFlags<TFlags, { optional: true }>>
  }

  unique(): IntFieldBuilder<MergeFlags<TFlags, { unique: true }>> {
    return super.unique() as unknown as IntFieldBuilder<MergeFlags<TFlags, { unique: true }>>
  }

  primary(): IntFieldBuilder<MergeFlags<TFlags, { primary: true; updatable: false }>> {
    return super.primary() as unknown as IntFieldBuilder<
      MergeFlags<TFlags, { primary: true; updatable: false }>
    >
  }

  hidden(): IntFieldBuilder<MergeFlags<TFlags, { hidden: true }>> {
    return super.hidden() as unknown as IntFieldBuilder<MergeFlags<TFlags, { hidden: true }>>
  }

  internal(): IntFieldBuilder<MergeFlags<TFlags, { internal: true }>> {
    return super.internal() as unknown as IntFieldBuilder<MergeFlags<TFlags, { internal: true }>>
  }

  auto(): IntFieldBuilder<
    MergeFlags<
      TFlags,
      { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
    >
  > {
    return super.auto() as unknown as IntFieldBuilder<
      MergeFlags<
        TFlags,
        { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
      >
    >
  }

  default(
    value: NormalizeValue<number, TFlags>,
  ): IntFieldBuilder<MergeFlags<TFlags, { hasDefault: true; optional: true }>> {
    return super.default(value) as unknown as IntFieldBuilder<
      MergeFlags<TFlags, { hasDefault: true; optional: true }>
    >
  }

  min(value: number): IntFieldBuilder<TFlags> {
    return this.withValidation({ kind: 'min', value }) as IntFieldBuilder<TFlags>
  }

  max(value: number): IntFieldBuilder<TFlags> {
    return this.withValidation({ kind: 'max', value }) as IntFieldBuilder<TFlags>
  }
}

class DatetimeFieldBuilder<TFlags extends FieldFlags> extends BaseFieldBuilder<Date, 'datetime', TFlags> {
  nullable(): DatetimeFieldBuilder<MergeFlags<TFlags, { nullable: true }>> {
    return super.nullable() as unknown as DatetimeFieldBuilder<MergeFlags<TFlags, { nullable: true }>>
  }

  optional(): DatetimeFieldBuilder<MergeFlags<TFlags, { optional: true }>> {
    return super.optional() as unknown as DatetimeFieldBuilder<MergeFlags<TFlags, { optional: true }>>
  }

  unique(): DatetimeFieldBuilder<MergeFlags<TFlags, { unique: true }>> {
    return super.unique() as unknown as DatetimeFieldBuilder<MergeFlags<TFlags, { unique: true }>>
  }

  primary(): DatetimeFieldBuilder<MergeFlags<TFlags, { primary: true; updatable: false }>> {
    return super.primary() as unknown as DatetimeFieldBuilder<
      MergeFlags<TFlags, { primary: true; updatable: false }>
    >
  }

  hidden(): DatetimeFieldBuilder<MergeFlags<TFlags, { hidden: true }>> {
    return super.hidden() as unknown as DatetimeFieldBuilder<MergeFlags<TFlags, { hidden: true }>>
  }

  internal(): DatetimeFieldBuilder<MergeFlags<TFlags, { internal: true }>> {
    return super.internal() as unknown as DatetimeFieldBuilder<MergeFlags<TFlags, { internal: true }>>
  }

  auto(): DatetimeFieldBuilder<
    MergeFlags<
      TFlags,
      { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
    >
  > {
    return super.auto() as unknown as DatetimeFieldBuilder<
      MergeFlags<
        TFlags,
        { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
      >
    >
  }

  default(
    value: NormalizeValue<Date, TFlags>,
  ): DatetimeFieldBuilder<MergeFlags<TFlags, { hasDefault: true; optional: true }>> {
    return super.default(value) as unknown as DatetimeFieldBuilder<
      MergeFlags<TFlags, { hasDefault: true; optional: true }>
    >
  }

  defaultNow(): DatetimeFieldBuilder<MergeFlags<TFlags, { hasDefault: true; optional: true }>> {
    return this.next(
      { ...this.flags, hasDefault: true, optional: true } as MergeFlags<
        TFlags,
        { hasDefault: true; optional: true }
      >,
      this.validations,
      'now',
    ) as DatetimeFieldBuilder<MergeFlags<TFlags, { hasDefault: true; optional: true }>>
  }
}

class IdFieldBuilder<TFlags extends FieldFlags> extends BaseFieldBuilder<number, 'id', TFlags> {
  nullable(): IdFieldBuilder<MergeFlags<TFlags, { nullable: true }>> {
    return super.nullable() as unknown as IdFieldBuilder<MergeFlags<TFlags, { nullable: true }>>
  }

  optional(): IdFieldBuilder<MergeFlags<TFlags, { optional: true }>> {
    return super.optional() as unknown as IdFieldBuilder<MergeFlags<TFlags, { optional: true }>>
  }

  unique(): IdFieldBuilder<MergeFlags<TFlags, { unique: true }>> {
    return super.unique() as unknown as IdFieldBuilder<MergeFlags<TFlags, { unique: true }>>
  }

  primary(): IdFieldBuilder<MergeFlags<TFlags, { primary: true; updatable: false }>> {
    return super.primary() as unknown as IdFieldBuilder<
      MergeFlags<TFlags, { primary: true; updatable: false }>
    >
  }

  hidden(): IdFieldBuilder<MergeFlags<TFlags, { hidden: true }>> {
    return super.hidden() as unknown as IdFieldBuilder<MergeFlags<TFlags, { hidden: true }>>
  }

  internal(): IdFieldBuilder<MergeFlags<TFlags, { internal: true }>> {
    return super.internal() as unknown as IdFieldBuilder<MergeFlags<TFlags, { internal: true }>>
  }

  auto(): IdFieldBuilder<
    MergeFlags<
      TFlags,
      { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
    >
  > {
    return super.auto() as unknown as IdFieldBuilder<
      MergeFlags<
        TFlags,
        { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
      >
    >
  }

  default(
    value: NormalizeValue<number, TFlags>,
  ): IdFieldBuilder<MergeFlags<TFlags, { hasDefault: true; optional: true }>> {
    return super.default(value) as unknown as IdFieldBuilder<
      MergeFlags<TFlags, { hasDefault: true; optional: true }>
    >
  }
}

class BooleanFieldBuilder<TFlags extends FieldFlags> extends BaseFieldBuilder<boolean, 'boolean', TFlags> {
  nullable(): BooleanFieldBuilder<MergeFlags<TFlags, { nullable: true }>> {
    return super.nullable() as unknown as BooleanFieldBuilder<MergeFlags<TFlags, { nullable: true }>>
  }

  optional(): BooleanFieldBuilder<MergeFlags<TFlags, { optional: true }>> {
    return super.optional() as unknown as BooleanFieldBuilder<MergeFlags<TFlags, { optional: true }>>
  }

  unique(): BooleanFieldBuilder<MergeFlags<TFlags, { unique: true }>> {
    return super.unique() as unknown as BooleanFieldBuilder<MergeFlags<TFlags, { unique: true }>>
  }

  primary(): BooleanFieldBuilder<MergeFlags<TFlags, { primary: true; updatable: false }>> {
    return super.primary() as unknown as BooleanFieldBuilder<
      MergeFlags<TFlags, { primary: true; updatable: false }>
    >
  }

  hidden(): BooleanFieldBuilder<MergeFlags<TFlags, { hidden: true }>> {
    return super.hidden() as unknown as BooleanFieldBuilder<MergeFlags<TFlags, { hidden: true }>>
  }

  internal(): BooleanFieldBuilder<MergeFlags<TFlags, { internal: true }>> {
    return super.internal() as unknown as BooleanFieldBuilder<MergeFlags<TFlags, { internal: true }>>
  }

  auto(): BooleanFieldBuilder<
    MergeFlags<
      TFlags,
      { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
    >
  > {
    return super.auto() as unknown as BooleanFieldBuilder<
      MergeFlags<
        TFlags,
        { autoIncrement: true; hasDefault: true; optional: true; updatable: false }
      >
    >
  }

  default(
    value: NormalizeValue<boolean, TFlags>,
  ): BooleanFieldBuilder<MergeFlags<TFlags, { hasDefault: true; optional: true }>> {
    return super.default(value) as unknown as BooleanFieldBuilder<
      MergeFlags<TFlags, { hasDefault: true; optional: true }>
    >
  }
}

export const createDefaultFlags = (): DefaultFieldFlags => ({ ...defaultFlags })

export const string = (): StringFieldBuilder<DefaultFieldFlags> =>
  new StringFieldBuilder('string', createDefaultFlags(), [])

export const int = (): IntFieldBuilder<DefaultFieldFlags> =>
  new IntFieldBuilder('int', createDefaultFlags(), [])

export const datetime = (): DatetimeFieldBuilder<DefaultFieldFlags> =>
  new DatetimeFieldBuilder('datetime', createDefaultFlags(), [])

export const boolean = (): BooleanFieldBuilder<DefaultFieldFlags> =>
  new BooleanFieldBuilder('boolean', createDefaultFlags(), [])

export const id = (): IdFieldBuilder<DefaultIdFlags> =>
  new IdFieldBuilder('id', {
    ...createDefaultFlags(),
    primary: true,
    autoIncrement: true,
    hasDefault: true,
    optional: true,
    updatable: false,
  }, [])
