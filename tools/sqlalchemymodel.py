import uuid

from sqlalchemy.types import TypeDecorator, BINARY
from sqlalchemy.dialects.postgresql import UUID as psqlUUID

class UUID(TypeDecorator):
	"""Platform-independent GUID type.

	Uses Postgresql's UUID type, otherwise uses
	BINARY(16), to store UUID.

	"""
	impl = BINARY

	def load_dialect_impl(self, dialect):
		if dialect.name == 'postgresql':
			return dialect.type_descriptor(psqlUUID())
		else:
			return dialect.type_descriptor(BINARY(16))

	def process_bind_param(self, value, dialect):
		if value is None:
			return value
		else:
			if not isinstance(value, uuid.UUID):
				if isinstance(value, bytes):
					value = uuid.UUID(bytes=value)
				elif isinstance(value, int):
					value = uuid.UUID(int=value)
				elif isinstance(value, str):
					value = uuid.UUID(value)
		if dialect.name == 'postgresql':
			return str(value)
		else:
			return value.bytes


class Theme(Base):
	_id = Column(UUID, primary_key=True)
	name = Column(String(32))


class Type(Base):
	_id = Column(UUID, primary_key=True)
	name = Column(String(32))


class FormulaParameter(Base):
	formula_id = Column(UUID, primary_key=True)
	formula = relationship('Formula', backref=backref('parameters'))
	key = Column(UUID, primary_key=True)
	name = Column(String(32))


class Formula(Base):
	_id = Column(UUID, primary_key=True)
	indicator_id = Column(UUID, ForeignKey('indicator._id'))
	indicator = relationship("Indicator", backref=backref('formulas', order_by=_id))
	expression = Column(String(32))

class Indicator(Base):

	_id = Column(UUID, primary_key=True)
	name = Column(String(32))
	standard = Column(String(32))
	sources = Column(String(32))
	comments = Column(String(32))

	operation
	target
	unit


class ProjectEntity(Base):
	_id = Column(UUID, primary_key=True)
	project_id = Column(UUID, ForeignKey('project._id'))
	project = relationship("Project", backref=backref('entities', order_by=_id))

	name = Column(String(32))
	groups


class ProjectGroup(Base):
	_id = Column(UUID, primary_key=True)
	project_id = Column(UUID, ForeignKey('project._id'))
	project = relationship("Project", backref=backref('groups', order_by=_id))

	name = Column(String(32))
	entities


class ProjectIndicator(Base):

	_id = Column(UUID, primary_key=True)
	indicator_id
	formula_id

	relevance
	source
	baseline
	target
	red_limit
	yellow_limit


class ProjectActivity(Base):
	_id = Column(UUID, primary_key=True)
	result_id
	name = Column(String(32))


class ProjectResult(Base):
	_id = Column(UUID, primary_key=True)
	purpose_id
	name = Column(String(32))
	hypothesis


class ProjectPurpose(Base):
	_id = Column(UUID, primary_key=True)
	project_id = Column(UUID, ForeignKey('project._id'))
	project = relationship("Project", backref=backref('purposes', order_by=_id))

	name = Column(String(32))
	hypothesis


class ProjectSourceVariable(Base):
	_id = Column(UUID, primary_key=True)
	data_section
	name = Column(String(32))

class ProjectSourceSection(Base):
	_id = Column(UUID, primary_key=True)
	data_source
	name = Column(String(32))

class ProjectSourceDimensionElement(Base):
	_id = Column(UUID, primary_key=True)
	dimension
	name = Column(String(32))

class ProjectSourceDimension(Base):
	_id = Column(UUID, primary_key=True)
	data_source
	name = Column(String(32))



class Project(Base):
	_id = Column(UUID, primary_key=True)
	name = Column(String(32))
	start
	end
	periodicity
	collect


class Project(Base):
	_id = Column(UUID, primary_key=True)
	name = Column(String(32))
	begin
	end

	goal

class User(Base):

	_id = Column(UUID, primary_key=True)
	name = Column(String(32))
	role
